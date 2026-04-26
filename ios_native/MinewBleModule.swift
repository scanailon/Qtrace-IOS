import Foundation
import MTSensorV3Kit

@objc(MinewBleModule)
class MinewBleModule: RCTEventEmitter {

  private let central = MTCentralManagerV3.sharedInstance()
  // mac -> peripheral, populated during scan
  private var peripherals: [String: MTPeripheralV3] = [:]
  // mac -> connected peripheral
  private var connected: [String: MTPeripheralV3] = [:]

  // Secret keys for MST03, in order of preference
  private let secretKeys = ["minewtech1234567", "3141592653589793"]

  override static func requiresMainQueueSetup() -> Bool { return true }

  override func supportedEvents() -> [String] {
    return ["onDeviceFound", "onConnStateChange", "onHistoryData", "onBleStatusChange"]
  }

  // MARK: - Scan

  @objc func startScan() {
    peripherals.removeAll()

    central?.didChangesBluetoothStatus { [weak self] state in
      guard let self = self else { return }
      let status = state == .poweredOn ? "poweredOn" : "poweredOff"
      self.sendEvent(withName: "onBleStatusChange", body: ["status": status])
    }

    central?.startScan { [weak self] (devices: [MTPeripheralV3]?) in
      guard let self = self, let devices = devices else { return }
      var found: [[String: Any]] = []
      for device in devices {
        guard let mac = device.broadcast?.mac else { continue }
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
    central?.connectToPeriperal(peripheral)

    peripheral.connector?.didChangeConnection { [weak self] connection in
      guard let self = self else { return }
      switch connection {
      case .disconnected:
        self.connected.removeValue(forKey: mac)
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Disconnected"])
      case .connecting:
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Connecting"])
      case .connected:
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Connected"])
      case .validating:
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Validating"])
        // Try the provided password first, then fall back to secretKeys
        self.tryPassword(peripheral: peripheral, mac: mac, password: password, keyIndex: 0)
      case .vaildated:
        self.connected[mac] = peripheral
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "ConnectComplete"])
      default:
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "ValidateFailed"])
      }
    }
  }

  private func tryPassword(peripheral: MTPeripheralV3, mac: String, password: String, keyIndex: Int) {
    // Build ordered list: provided password first, then built-in keys (deduped)
    var keys = [password]
    for k in secretKeys where k != password { keys.append(k) }
    guard keyIndex < keys.count else {
      sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "ValidateFailed"])
      return
    }
    peripheral.connector?.sensorHandler?.writePassword(keys[keyIndex]) { [weak self] success in
      guard let self = self else { return }
      if !success && keyIndex + 1 < keys.count {
        self.tryPassword(peripheral: peripheral, mac: mac, password: password, keyIndex: keyIndex + 1)
      }
      // On success the connection state callback fires with .vaildated automatically
    }
  }

  @objc func disconnect(_ mac: String) {
    guard let peripheral = connected[mac] ?? peripherals[mac] else { return }
    central?.disconnectFromPeripheral(peripheral)
    connected.removeValue(forKey: mac)
  }

  // MARK: - History

  // htModel: 0 = MST01, 1 = MST03 (default)
  @objc func queryHistory(_ mac: String, startTs: Double, endTs: Double, htModel: Int) {
    guard let peripheral = connected[mac] else {
      sendEvent(withName: "onHistoryData", body: ["mac": mac, "error": "NotConnected", "data": []])
      return
    }

    let formatter = DateFormatter()
    formatter.dateFormat = "YYYY/MM/dd HH:mm:ss"
    formatter.timeZone = TimeZone.current

    // MTHtModelType: MST01 = 0, MST03 = 1
    let modelType: MTHtModelType = htModel == 0 ? .MST01 : .MST03

    peripheral.connector?.sensorHandler?.readHTHistory(
      with: formatter,
      unit: .celsius,
      deviceHTModelType: modelType
    ) { [weak self] success, totalNum, data in
      guard let self = self else { return }
      guard success, let records = data else {
        self.sendEvent(withName: "onHistoryData", body: ["mac": mac, "error": "ReadFailed", "data": []])
        return
      }

      // Filter by time range if provided
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
