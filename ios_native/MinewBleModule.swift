import Foundation

@objc(MinewBleModule)
class MinewBleModule: RCTEventEmitter {

  private let central = MTCentralManagerV3.sharedInstance()
  private var peripherals: [String: MTPeripheralV3] = [:]
  private var connected: [String: MTPeripheralV3] = [:]
  private let secretKeys = ["minewtech1234567", "3141592653589793"]

  override static func requiresMainQueueSetup() -> Bool { return true }

  override func supportedEvents() -> [String]! {
    return ["onDeviceFound", "onConnStateChange", "onHistoryData", "onBleStatusChange"]
  }

  // MARK: - Scan

  @objc func startScan() {
    peripherals.removeAll()

    // PowerState: Unknown=0, PoweredOff=1, PoweredOn=2
    central?.didChangesBluetoothStatus { [weak self] state in
      guard let self = self else { return }
      let status = state.rawValue == 2 ? "poweredOn" : "poweredOff"
      self.sendEvent(withName: "onBleStatusChange", body: ["status": status])
    }

    central?.startScan { [weak self] (devices: [MTPeripheralV3]?) in
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

  @objc func stopScan() {
    central?.stopScan()
  }

  // MARK: - Connect

  @objc func connect(_ mac: String, password: String) {
    guard let peripheral = peripherals[mac] else {
      sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "DeviceNotFound"])
      return
    }
    central?.stopScan()
    central?.connect(toPeriperal: peripheral)

    // Connection: Disconnected=0, Connected=1, Connecting=2, Validating=3, Vaildated=4, VaildateFailed=5
    peripheral.connector?.didChangeConnection { [weak self] connection in
      guard let self = self else { return }
      switch connection.rawValue {
      case 0: // Disconnected
        self.connected.removeValue(forKey: mac)
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Disconnected"])
      case 2: // Connecting
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Connecting"])
      case 1: // Connected
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Connected"])
      case 3: // Validating
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Validating"])
        self.tryPassword(peripheral: peripheral, mac: mac, password: password, keyIndex: 0)
      case 4: // Vaildated
        self.connected[mac] = peripheral
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "ConnectComplete"])
      default: // VaildateFailed, PasswordVaildateFailed
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
    guard let peripheral = connected[mac] ?? peripherals[mac] else { return }
    central?.disconnect(fromPeriperal: peripheral)
    connected.removeValue(forKey: mac)
  }

  // MARK: - History

  // htModel: 0 = PR2122, 1 = MST01 (MST03 uses MST01 model)
  @objc func queryHistory(_ mac: String, startTs: Double, endTs: Double, htModel: Int) {
    guard let peripheral = connected[mac] else {
      sendEvent(withName: "onHistoryData", body: ["mac": mac, "error": "NotConnected", "data": []])
      return
    }

    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy/MM/dd HH:mm:ss"
    formatter.timeZone = TimeZone.current

    // MTHTModel: PR2122=0, MST01=1
    let modelType = MTHTModel(rawValue: UInt(htModel == 0 ? 0 : 1)) ?? MTHTModel(rawValue: 1)!
    // MTTemperatureUnitType: Celsius=0
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
      let records = data

      let filtered = records.filter { record in
        guard startTs > 0 || endTs > 0 else { return true }
        let ts = record.timeInterval
        let afterStart = startTs <= 0 || ts >= startTs
        let beforeEnd = endTs <= 0 || ts <= endTs
        return afterStart && beforeEnd
      }

      let points: [[String: Any]] = filtered.map { record in
        ["timestamp": record.timeInterval, "temperature": record.temp, "humidity": record.humi]
      }
      self.sendEvent(withName: "onHistoryData", body: ["mac": mac, "error": NSNull(), "data": points])
    }
  }
}
