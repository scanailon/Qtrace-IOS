import Foundation
import ObjectiveC
import CoreBluetooth

@objc(MinewBleModule)
class MinewBleModule: RCTEventEmitter {

  private let central = MTCentralManagerV3.sharedInstance()
  private var peripherals: [String: MTPeripheralV3] = [:]
  private var connected: [String: MTPeripheralV3] = [:]
  private var connectorCache: [String: MTConnectionHandlerV3] = [:]
  private var proxyDelegate: MinewBleProxyDelegate?
  private let secretKeys = ["minew123", "minewtech1234567", "3141592653589793"]

  override static func requiresMainQueueSetup() -> Bool { return true }

  override init() {
    super.init()
    // requiresMainQueueSetup = true guarantees we're on the main thread here.
    installProxyDelegate()
  }

  // MARK: - Proxy delegate setup

  /// Uses the ObjC runtime to find the CBCentralManager ivar inside
  /// MTCentralManagerV3 and inserts our proxy as its delegate.
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
      print("[BLE] Proxy: CBCentralManager ivar not found in MTCentralManagerV3")
      return
    }

    let proxy = MinewBleProxyDelegate()
    proxy.originalDelegate = cbManager.delegate
    cbManager.delegate = proxy
    self.proxyDelegate = proxy
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

      self.central?.didChangesBluetoothStatus { [weak self] state in
        guard let self = self else { return }
        let status = state.rawValue == 2 ? "poweredOn" : "poweredOff"
        self.sendEvent(withName: "onBleStatusChange", body: ["status": status])
      }

      self.central?.startScan { [weak self] (devices: [MTPeripheralV3]?) in
        guard let self = self, let devices = devices else { return }
        var found: [[String: Any]] = []
        for device in devices {
          guard let mac = device.broadcast?.mac, !mac.isEmpty else { continue }
          self.peripherals[mac] = device
          found.append([
            "mac": mac,
            "name": device.broadcast?.name ?? "",
            "rssi": device.broadcast?.rssi ?? 0,
            "temp": device.broadcast?.temp ?? 0,
            "battery": device.broadcast?.battery ?? 0,
          ])
        }
        self.sendEvent(withName: "onDeviceFound", body: found)
      }
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

      let peripheral = self.central?.scannedPeris?.first(where: { $0.broadcast?.mac == mac })
                    ?? self.peripherals[mac]
      guard let peripheral = peripheral else {
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "DeviceNotFound"])
        return
      }

      self.central?.stopScan()
      // connect() sets peripheral.connector synchronously before returning.
      self.central?.connect(toPeriperal: peripheral)
      print("[BLE] connect called, connector nil: \(peripheral.connector == nil)")

      // Give the proxy the connector so it can set CBPeripheral.delegate
      // before the SDK's centralManager:didConnectPeripheral: body runs.
      self.proxyDelegate?.pendingConnector = peripheral.connector

      // Keep a strong reference so ARC doesn't collect the connector while
      // CBPeripheral.delegate (a weak property) still points to it.
      if let connector = peripheral.connector {
        self.connectorCache[mac] = connector
      }

      self.registerConnectorCallback(peripheral: peripheral, mac: mac, password: password)
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
        guard let self = self else { return }
        self.registerConnectorCallback(peripheral: peripheral, mac: mac, password: password)
      }
    }
  }

  private func registerConnectorCallback(peripheral: MTPeripheralV3, mac: String, password: String) {
    guard let connector = peripheral.connector else { return }
    connectorCache[mac] = connector
    connector.didChangeConnection { [weak self] connection in
      guard let self = self else { return }
      switch connection.rawValue {
      case 0: // Disconnected
        self.connected.removeValue(forKey: mac)
        self.connectorCache.removeValue(forKey: mac)
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Disconnected"])
      case 2: // Connecting
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Connecting"])
      case 1: // Connected
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Connected"])
      case 3: // Validating
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Validating"])
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
          self.tryPassword(peripheral: peripheral, mac: mac, password: password, keyIndex: 0)
        }
      case 4: // Vaildated
        self.connected[mac] = peripheral
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "ConnectComplete"])
      default:
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "ValidateFailed"])
      }
    }
  }

  private func tryPassword(peripheral: MTPeripheralV3, mac: String, password: String, keyIndex: Int) {
    var keys = [password]
    for k in secretKeys where k != password { keys.append(k) }
    guard keyIndex < keys.count else {
      sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "ValidateFailed"])
      return
    }
    peripheral.connector?.sensorHandler.writePassword(keys[keyIndex]) { [weak self] success in
      guard let self = self else { return }
      if !success && keyIndex + 1 < keys.count {
        self.tryPassword(peripheral: peripheral, mac: mac, password: password, keyIndex: keyIndex + 1)
      }
    }
  }

  @objc func disconnect(_ mac: String) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      guard let peripheral = self.connected[mac] ?? self.peripherals[mac] else { return }
      self.central?.disconnect(fromPeriperal: peripheral)
      self.connected.removeValue(forKey: mac)
      self.connectorCache.removeValue(forKey: mac)
    }
  }

  // MARK: - History

  // htModel: 0 = PR2122, 1 = MST01 (MST03 uses MST01 model)
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

      let modelType = MTHTModel(rawValue: UInt(htModel == 0 ? 0 : 1)) ?? MTHTModel(rawValue: 1)!
      let unitType = MTTemperatureUnitType(rawValue: 0)!

      peripheral.connector?.sensorHandler.readHTHistory(
        with: formatter,
        unit: unitType,
        deviceHTModelType: modelType
      ) { [weak self] success, _, data in
        guard let self = self else { return }
        guard success else {
          self.sendEvent(withName: "onHistoryData", body: ["mac": mac, "error": "ReadFailed", "data": []])
          return
        }

        let filtered = data.filter { record in
          guard startTs > 0 || endTs > 0 else { return true }
          let ts = record.timeInterval
          return (startTs <= 0 || ts >= startTs) && (endTs <= 0 || ts <= endTs)
        }

        let points: [[String: Any]] = filtered.map { record in
          ["timestamp": record.timeInterval, "temperature": record.temp, "humidity": record.humi]
        }
        self.sendEvent(withName: "onHistoryData", body: ["mac": mac, "error": NSNull(), "data": points])
      }
    }
  }
}
