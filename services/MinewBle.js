import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

// On Android, BLE is handled by the existing MST03SensorBleManager via the
// native Android app (widgets/QTrace). This module only bridges iOS.

// Lazy initialization: NativeModules may not be populated at import time
// with the new architecture, so we resolve the module on first use.
let _module = null;
let _emitter = null;

function getModule() {
  if (!_module) {
    _module = NativeModules.MinewBleModule ?? null;
  }
  return _module;
}

function getEmitter() {
  if (!_emitter) {
    const mod = getModule();
    if (mod) _emitter = new NativeEventEmitter(mod);
  }
  return _emitter;
}

function isSupported() {
  return Platform.OS === 'ios' && getModule() != null;
}

function noopSubscription() {
  return { remove: () => {} };
}

export const MinewBle = {
  get isSupported() {
    return isSupported();
  },

  startScan() {
    if (!isSupported()) return;
    getModule().startScan();
  },

  stopScan() {
    if (!isSupported()) return;
    getModule().stopScan();
  },

  connect(mac, password = 'minewtech1234567') {
    if (!isSupported()) return;
    getModule().connect(mac, password);
  },

  disconnect(mac) {
    if (!isSupported()) return;
    getModule().disconnect(mac);
  },

  queryHistory(mac, startTs = 0, endTs = 0, htModel = 1) {
    if (!isSupported()) return;
    getModule().queryHistory(mac, startTs, endTs, htModel);
  },

  onDeviceFound(callback) {
    const emitter = getEmitter();
    if (!emitter) return noopSubscription();
    return emitter.addListener('onDeviceFound', callback);
  },

  onConnStateChange(callback) {
    const emitter = getEmitter();
    if (!emitter) return noopSubscription();
    return emitter.addListener('onConnStateChange', callback);
  },

  onHistoryData(callback) {
    const emitter = getEmitter();
    if (!emitter) return noopSubscription();
    return emitter.addListener('onHistoryData', callback);
  },

  onBleStatusChange(callback) {
    const emitter = getEmitter();
    if (!emitter) return noopSubscription();
    return emitter.addListener('onBleStatusChange', callback);
  },
};
