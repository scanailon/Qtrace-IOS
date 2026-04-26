import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { MinewBleModule } = NativeModules;

// On Android, BLE is handled by the existing MST03SensorBleManager via the
// native Android app (widgets/QTrace). This module only bridges iOS.
const isSupported = Platform.OS === 'ios' && MinewBleModule != null;

const emitter = isSupported ? new NativeEventEmitter(MinewBleModule) : null;

function noopSubscription() {
  return { remove: () => {} };
}

export const MinewBle = {
  isSupported,

  startScan() {
    if (!isSupported) return;
    MinewBleModule.startScan();
  },

  stopScan() {
    if (!isSupported) return;
    MinewBleModule.stopScan();
  },

  /**
   * Connect to a sensor by MAC address.
   * Tries the provided password first, then falls back to built-in keys.
   * @param {string} mac
   * @param {string} [password='minewtech1234567']
   */
  connect(mac, password = 'minewtech1234567') {
    if (!isSupported) return;
    MinewBleModule.connect(mac, password);
  },

  disconnect(mac) {
    if (!isSupported) return;
    MinewBleModule.disconnect(mac);
  },

  /**
   * Query temperature history for a connected sensor.
   * @param {string} mac
   * @param {number} startTs - Unix timestamp in seconds (0 = no filter)
   * @param {number} endTs   - Unix timestamp in seconds (0 = no filter)
   * @param {number} [htModel=1] - 0=MST01, 1=MST03
   */
  queryHistory(mac, startTs = 0, endTs = 0, htModel = 1) {
    if (!isSupported) return;
    MinewBleModule.queryHistory(mac, startTs, endTs, htModel);
  },

  /**
   * Fires with the current list of visible BLE devices (updated every scan cycle).
   * Payload: Array<{ mac, name, rssi, temp, battery }>
   */
  onDeviceFound(callback) {
    if (!isSupported) return noopSubscription();
    return emitter.addListener('onDeviceFound', callback);
  },

  /**
   * Fires when a device connection state changes.
   * Payload: { mac, state } — state values:
   *   "Connecting" | "Connected" | "Validating" | "ConnectComplete" |
   *   "Disconnected" | "ValidateFailed" | "DeviceNotFound"
   */
  onConnStateChange(callback) {
    if (!isSupported) return noopSubscription();
    return emitter.addListener('onConnStateChange', callback);
  },

  /**
   * Fires with history data after queryHistory resolves.
   * Payload: { mac, error: string|null, data: Array<{ timestamp, temperature, humidity }> }
   */
  onHistoryData(callback) {
    if (!isSupported) return noopSubscription();
    return emitter.addListener('onHistoryData', callback);
  },

  /**
   * Fires when Bluetooth adapter state changes.
   * Payload: { status: "poweredOn" | "poweredOff" }
   */
  onBleStatusChange(callback) {
    if (!isSupported) return noopSubscription();
    return emitter.addListener('onBleStatusChange', callback);
  },
};
