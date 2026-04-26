import Foundation

@objc(MinewBleModule)
class MinewBleModule: RCTEventEmitter {

  private let central = MTCentralManagerV3.sharedInstance()
  private var peripherals: [String: MTPeripheralV3] = [:]
  private var connected: [String: MTPeripheralV3] = [:]
  private let secretKeys = ["minew123", "minewtech1234567", "3141592653589793"]

  override static func requiresMainQueueSetup() -> Bool { return true }

  override func supportedEvents() -> [String]! {
    return ["onDeviceFound", "onConnStateChange", "onHistoryData", "onBleStatusChange"]
  }

  // MARK: - Scan

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
      // Prefer the live SDK-tracked object over our cached copy so the SDK's
      // internal CBPeripheral→MTPeripheralV3 map stays consistent.
      let peripheral = self.central?.scannedPeris?.first(where: { $0.broadcast?.mac == mac })
                    ?? self.peripherals[mac]
      guard let peripheral = peripheral else {
        self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "DeviceNotFound"])
        return
      }
      // Do NOT call stopScan() here — the SDK uses its scanned-peripherals map
      // inside centralManager:didConnectPeripheral: to set cbPeripheral.delegate.
      // Calling stopScan first clears that map, leaving delegate nil and causing
      // "API MISUSE: Discovering services while delegate is nil".
      self.central?.connect(toPeriperal: peripheral)

      peripheral.connector?.didChangeConnection { [weak self] connection in
        guard let self = self else { return }
        switch connection.rawValue {
        case 0: // Disconnected
          self.connected.removeValue(forKey: mac)
          self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Disconnected"])
        case 2: // Connecting
          self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Connecting"])
        case 1: // Connected — safe to stop scan now that the SDK has the peripheral
          self.central?.stopScan()
          self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Connected"])
        case 3: // Validating
          self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "Validating"])
          DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.tryPassword(peripheral: peripheral, mac: mac, password: password, keyIndex: 0)
          }
        case 4: // Vaildated
          self.connected[mac] = peripheral
          self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "ConnectComplete"])
        default: // VaildateFailed, PasswordVaildateFailed
          self.sendEvent(withName: "onConnStateChange", body: ["mac": mac, "state": "ValidateFailed"])
        }
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
}
