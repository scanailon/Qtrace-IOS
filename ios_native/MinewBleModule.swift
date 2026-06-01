import Foundation
import ObjectiveC
import CoreBluetooth

@objc(MinewBleModule)
class MinewBleModule: RCTEventEmitter {

  private let central = MTICentralManager.sharedInstance()
  private var peripherals: [String: MTIPeripheral] = [:]
  private var connected: [String: MTIPeripheral] = [:]
  private var connectorCache: [String: MTIConnectionHandler] = [:]
  private var proxyDelegate: MinewBleProxyDelegate?
  private var cbCentralManager: CBCentralManager?
  private var pendingScan = false
  private var retryingMacs: Set<String> = []
  private let secretKeys = ["minew123", "minewtech1234567", "3141592653589793"]

  override static func requiresMainQueueSetup() -> Bool { return true }

  override init() {
    super.init()
    installProxyDelegate()
  }

  // MARK: - Proxy delegate setup

  /// Uses the ObjC runtime to find the CBCentralManager ivar inside
  /// MTICentralManager and inserts our proxy as its delegate.
  /// The proxy sets CBPeripheral.delegate BEFORE the SDK's
  /// centralManager:didConnectPeripheral: runs, fixing the SDK bug.
  private func installProxyDelegate() {
    guard let central = central else { return }

    var cbManager: CBCentralManager?
    var cls: AnyClass? = type(of: central)
    outer: while let klass = cls {
      var count: UInt32 = 0
      guard let ivars = class_copyIvarList(klass, &count) else {
        cls = class_getSuperclass(klass); continue
      }
      for i in 0..<Int(count) {
        let ivar = ivars[i]
        guard let enc = ivar_getTypeEncoding(ivar) else { continue }
        if String(cString: enc).contains("CBCentralManager") {
          cbManager = object_getIvar(central, ivar) as? CBCentralManager
          free(ivars); break outer
        }
      }
      free(ivars)
      cls = class_getSuperclass(klass)
    }

    guard let cbManager = cbManager else {
      print("[BLE] Proxy: CBCentralManager ivar not found in MTICentralManager")
      return
    }

    let proxy = MinewBleProxyDelegate()
    proxy.originalDelegate = cbManager.delegate
    cbManager.delegate = proxy
    self.proxyDelegate = proxy
    self.cbCentralManager = cbManager
    print("[BLE] Proxy delegate installed")
  }

  // MARK: - Scan

  override func supportedEvents() -> [String]! {
    return ["onDeviceFound", "onConnStateChange", "onHistoryData", "onBleStatusChange"]
  }

  @objc func startScan() {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      self.peripherals.removeAll()
      self.pendingScan = true

      self.central?.didChangesBluetoothStatus { [weak self] state in
        guard let self = self else { return }
        let powered = state.rawValue == 2  // PowerStatePoweredOn
        self.sendEvent(withName: "onBleStatusChange", body: ["status": powered ? "poweredOn" : "poweredOff"])
        if powered && self.pendingScan {
          self.pendingScan = false
          self.doStartScan()
        }
      }

      if self.cbCentralManager?.state == .poweredOn {
        self.pendingScan = false
        self.doStartScan()
      }
    }
  }

  private func doStartScan() {
    central?.startScan { [weak self] (devices: [MTIPeripheral]?) in
      guard let self = self, let devices = devices else { return }
      var found: [[String: Any]] = []
      for device in devices {
        guard let fh = device.frameHandler else { continue }
        guard let mac = fh.mac, !mac.isEmpty else { continue }
        self.peripherals[mac] = device

        var temp: Double = 0
        for frame in fh.advFrames ?? [] {
          if frame.frameType == MTIFrameHTSensor, let htf = frame as? MTITempHumiFrame {
            temp = htf.temp; break
          }
          if frame.frameType == MTSModelTypeAssetTemTagInfo, let otf = frame as? MTIOnlyTempFrame {
            temp = otf.temp; break
          }
        }

        found.append([
          "mac":     mac,
          "name":    fh.name ?? "",
          "rssi":    fh.rssi,
          "battery": fh.battery,
          "temp":    temp,
        ])
      }
      self.sendEvent(withName: "onDeviceFound", body: found)
    }
  }

  @objc func stopScan() {
    DispatchQueue.main.async { [weak self] in
      self?.central?.stopScan()
    }
  }

  // MARK: - Connect

  @objc func connect(_ mac: String, password: String) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }

      let peripheral = self.central?.scannedPeris?.first(where: { $0.frameHandler?.mac == mac })
                    ?? self.peripherals[mac]
      guard let peripheral = peripheral else {
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "DeviceNotFound"])
        return
      }

      self.central?.stopScan()

      var keys = [password]
      for k in self.secretKeys where k != password { keys.append(k) }

      self.attemptConnect(peripheral: peripheral, mac: mac, keys: keys, keyIndex: 0)
    }
  }

  private func attemptConnect(peripheral: MTIPeripheral, mac: String, keys: [String], keyIndex: Int) {
    guard keyIndex < keys.count else {
      sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "ValidateFailed"])
      return
    }

    central?.connectToPeriperal(peripheral, secretKey: keys[keyIndex])
    proxyDelegate?.pendingConnector = peripheral.connector
    if let connector = peripheral.connector {
      connectorCache[mac] = connector
    }

    registerConnectorCallback(peripheral: peripheral, mac: mac, keys: keys, keyIndex: keyIndex)
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
      guard let self = self else { return }
      self.registerConnectorCallback(peripheral: peripheral, mac: mac, keys: keys, keyIndex: keyIndex)
    }
  }

  private func registerConnectorCallback(peripheral: MTIPeripheral, mac: String,
                                          keys: [String], keyIndex: Int) {
    guard let connector = peripheral.connector else { return }
    connectorCache[mac] = connector

    connector.didChangeConnection { [weak self] connection in
      guard let self = self else { return }
      switch connection.rawValue {
      case 0: // Disconnected
        if self.retryingMacs.contains(mac) { return }
        self.connected.removeValue(forKey: mac)
        self.connectorCache.removeValue(forKey: mac)
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Disconnected"])

      case 2: // Connecting
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Connecting"])

      case 1: // Connected
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Connected"])

      case 3: // Validating
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Validating"])

      case 4: // Vaildated — success
        self.retryingMacs.remove(mac)
        self.connected[mac] = peripheral
        self.connectorCache.removeValue(forKey: mac)
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "ConnectComplete"])

      case 5: // VaildateFailed
        self.connected.removeValue(forKey: mac)
        self.connectorCache.removeValue(forKey: mac)
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "ValidateFailed"])

      case 6: // PasswordVaildateFailed — wrong key, try next
        self.connectorCache.removeValue(forKey: mac)
        let nextIndex = keyIndex + 1
        if nextIndex < keys.count {
          self.retryingMacs.insert(mac)
          self.central?.disconnectFromPeriperal(peripheral)
          DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            guard let self = self else { return }
            self.retryingMacs.remove(mac)
            self.attemptConnect(peripheral: peripheral, mac: mac, keys: keys, keyIndex: nextIndex)
          }
        } else {
          self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "ValidateFailed"])
        }

      default:
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "ValidateFailed"])
      }
    }
  }

  @objc func disconnect(_ mac: String) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      guard let peripheral = self.connected[mac] ?? self.peripherals[mac] else { return }
      self.central?.disconnectFromPeriperal(peripheral)
      self.connected.removeValue(forKey: mac)
      self.connectorCache.removeValue(forKey: mac)
    }
  }

  // MARK: - History

  // htModel: 0 = PR2122, 1 = MST01, 2 = MST03 (asset temperature tag)
  @objc func queryHistory(_ mac: String, startTs: Double, endTs: Double, htModel: Int) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      guard let peripheral = self.connected[mac] else {
        self.sendEvent(withName: "onHistoryData", body: ["mac": mac, "error": "NotConnected", "data": []])
        return
      }

      let formatter = DateFormatter()
      formatter.dateFormat = "yyyy/MM/dd HH:mm:ss"
      formatter.timeZone = TimeZone.current

      let now = Date().timeIntervalSince1970
      let startInterval: TimeInterval = startTs > 0 ? startTs : 0
      let endInterval: TimeInterval   = endTs   > 0 ? endTs   : now

      if htModel == 2 {
        // MST03 asset temperature tag
        peripheral.connector?.sensorHandler.readAssetTemHistory(
          with: formatter,
          startTimeInterval: startInterval,
          endTimeInterval: endInterval,
          systemTimeInterval: now
        ) { [weak self] success, _, data in
          self?.emitHistory(mac: mac, success: success, data: data)
        }
      } else {
        // MST01 / PR2122 industrial HT sensor
        let modelType = MTIHTModel(rawValue: UInt(htModel)) ?? MTIHTModel(rawValue: 1)!
        peripheral.connector?.sensorHandler.readHTHistory(
          with: formatter,
          unit: MTITemperatureUnitType(rawValue: 0)!,
          startTimeInterval: startInterval,
          endTimeInterval: endInterval,
          systemTimeInterval: now,
          deviceHTModelType: modelType
        ) { [weak self] success, _, data in
          self?.emitHistory(mac: mac, success: success, data: data)
        }
      }
    }
  }

  private func emitHistory(mac: String, success: Bool, data: [MTIHistoryData]?) {
    guard success, let records = data else {
      sendEvent(withName: "onHistoryData", body: ["mac": mac, "error": "ReadFailed", "data": []])
      return
    }
    let points: [[String: Any]] = records.map { r in
      ["timestamp": r.timeInterval, "temperature": r.temp, "humidity": r.humi]
    }
    sendEvent(withName: "onHistoryData", body: ["mac": mac, "error": NSNull(), "data": points])
  }
}
