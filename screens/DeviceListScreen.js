import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS } from '../constants/colors';
import { getTrackers } from '../services/apiService';
import { MinewBle } from '../services/MinewBle';

export default function DeviceListScreen({ onNavigate, onSelectDevice, user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // BLE / QR state (iOS only)
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [bleStatus, setBleStatus] = useState(null); // null | 'scanning' | 'connecting' | 'connected' | 'error'
  const [bleMessage, setBleMessage] = useState('');
  const scannedRef = useRef(false);
  const bleSubscriptions = useRef([]);

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    return () => {
      // Clean up BLE listeners on unmount
      bleSubscriptions.current.forEach((s) => s.remove());
    };
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const customerId = user?.customerId;
      if (!customerId) {
        setError('No se encontró el ID del cliente.');
        setDevices([]);
        return;
      }
      const data = await getTrackers(customerId);
      setDevices(data || []);
    } catch (e) {
      console.error('Error cargando sensores:', e);
      setError('No se pudieron cargar los sensores.');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices = devices.filter(
    (device) =>
      (device.nombre_sensor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (device.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectDevice = (device) => {
    if (onSelectDevice) onSelectDevice(device);
    if (onNavigate) onNavigate('report', { device });
  };

  // ── BLE helpers ────────────────────────────────────────────────────────────

  const startBleForMac = useCallback((mac) => {
    // Remove previous subscriptions
    bleSubscriptions.current.forEach((s) => s.remove());
    bleSubscriptions.current = [];

    setBleStatus('scanning');
    setBleMessage(`Buscando sensor ${mac}…`);

    const foundSub = MinewBle.onDeviceFound((deviceList) => {
      console.log('[BLE] onDeviceFound fired, devices:', JSON.stringify(deviceList));
      const match = deviceList.find(
        (d) => d.mac?.toUpperCase() === mac.toUpperCase()
      );
      console.log('[BLE] Looking for MAC:', mac, '| match:', match ? 'YES' : 'NO');
      if (!match || connecting) return;
      connecting = true;

      const bleMac = match.mac;
      activeMac = bleMac;
      setBleStatus('connecting');
      setBleMessage(`Conectando a ${bleMac}…`);
      MinewBle.connect(bleMac);
    });

    let activeMac = mac;
    let connecting = false;
    const connSub = MinewBle.onConnStateChange(({ mac: m, state }) => {
      if (m?.toUpperCase() !== activeMac.toUpperCase()) return;
      if (state === 'ConnectComplete') {
        setBleStatus('connected');
        setBleMessage('Conectado');

        const htModel = 2; // app is MST03-only

        // Find device in list or create stub for unregistered sensor
        const match = devices.find(
          (d) => (d.name || '').toUpperCase() === mac.replace(/:/g, '').toUpperCase()
            || (d.code || '').toUpperCase() === mac.toUpperCase()
        );
        const deviceObj = match
          ? { ...match, bleConnected: true, bleMac: mac, htModel }
          : {
              id: mac,
              name: mac.replace(/:/g, ''),
              nombre_sensor: `Sensor ${mac}`,
              isUnregistered: true,
              bleConnected: true,
              bleMac: mac,
              htModel,
            };
        console.log('[BLE] ConnectComplete — htModel:', htModel, 'mac:', mac);
        setBleStatus(null);
        handleSelectDevice(deviceObj);
      } else if (state === 'ValidateFailed' || state === 'DeviceNotFound') {
        setBleStatus('error');
        setBleMessage('No se pudo autenticar el sensor.');
        MinewBle.disconnect(mac);
      } else if (state === 'Disconnected') {
        if (bleStatus === 'connecting') {
          setBleStatus('error');
          setBleMessage('El sensor se desconectó durante la conexión.');
        }
      }
    });

    bleSubscriptions.current = [foundSub, connSub];
    console.log('[BLE] isSupported:', MinewBle.isSupported, '| Starting scan for:', mac);
    MinewBle.startScan();

    // Auto timeout after 20 s
    setTimeout(() => {
      if (bleStatus === 'scanning' || bleStatus === 'connecting') {
        MinewBle.stopScan();
        setBleStatus('error');
        setBleMessage('Tiempo de espera agotado. ¿El sensor está encendido?');
      }
    }, 20000);
  }, [devices, bleStatus]);

  const handleBleScanQr = async () => {
    if (!MinewBle.isSupported) {
      Alert.alert('No disponible', 'El escáner BLE solo está disponible en iOS.');
      return;
    }
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para escanear el QR.');
        return;
      }
    }
    scannedRef.current = false;
    setShowQrScanner(true);
  };

  const handleQrScanned = ({ data }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setShowQrScanner(false);
    // MAC can come as "AA:BB:CC:DD:EE:FF" or "AABBCCDDEEFF"
    const raw = (data || '').trim().toUpperCase();
    const mac = raw.includes(':') ? raw : raw.replace(/(.{2})(?=.)/g, '$1:');
    console.log('[QR] raw data:', data, '| parsed MAC:', mac);
    startBleForMac(mac);
  };

  // ───────────────────────────────────────────────────────────────────────────

  const renderDeviceItem = ({ item }) => {
    return (
      <View style={styles.deviceItem}>
        <View style={styles.deviceContent}>
          <View style={styles.colorSection}>
            <View style={styles.deviceIconContainer}>
              <Feather name="radio" size={20} color={COLORS.PRIMARY} />
            </View>
          </View>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName} numberOfLines={1}>
              {item.nombre_sensor || item.name}
            </Text>
            <Text style={styles.deviceCode}>{item.name}</Text>
            {item.unidad ? (
              <Text style={styles.deviceUnit}>{item.unidad}</Text>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerGradient} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => onNavigate('dashboard')}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={20} color={COLORS.WHITE} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Escanear Sensor</Text>
              <Text style={styles.headerSubtitle}>
                {loading
                  ? 'Cargando sensores...'
                  : `${devices.length} sensor${devices.length !== 1 ? 'es' : ''} disponible${devices.length !== 1 ? 's' : ''}`}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color={COLORS.GRAY_DARK} style={styles.searchIconLeft} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar dispositivo..."
          placeholderTextColor={COLORS.GRAY_DARK}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      {/* BLE scan button — iOS only */}
      {Platform.OS === 'ios' && MinewBle.isSupported && (
        <TouchableOpacity
          style={styles.bleButton}
          onPress={handleBleScanQr}
          activeOpacity={0.8}
          disabled={bleStatus === 'scanning' || bleStatus === 'connecting'}
        >
          {bleStatus === 'scanning' || bleStatus === 'connecting' ? (
            <>
              <ActivityIndicator size="small" color={COLORS.WHITE} />
              <Text style={styles.bleButtonText}>{bleMessage}</Text>
            </>
          ) : (
            <>
              <Feather name="bluetooth" size={16} color={COLORS.WHITE} />
              <Text style={styles.bleButtonText}>Escanear QR del sensor</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {bleStatus === 'error' && (
        <View style={styles.bleError}>
          <Feather name="alert-circle" size={14} color={COLORS.ERROR} />
          <Text style={styles.bleErrorText}>{bleMessage}</Text>
          <TouchableOpacity onPress={() => setBleStatus(null)}>
            <Feather name="x" size={14} color={COLORS.GRAY_DARK} />
          </TouchableOpacity>
        </View>
      )}

      {/* QR scanner modal */}
      <Modal visible={showQrScanner} animationType="slide" onRequestClose={() => setShowQrScanner(false)}>
        <View style={styles.qrContainer}>
          <CameraView
            style={styles.qrCamera}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleQrScanned}
          />
          <View style={styles.qrOverlay}>
            <Text style={styles.qrHint}>Apunta al código QR del sensor</Text>
            <TouchableOpacity style={styles.qrClose} onPress={() => setShowQrScanner(false)}>
              <Feather name="x" size={24} color={COLORS.WHITE} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Cargando sensores...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Feather name="alert-circle" size={48} color={COLORS.ERROR} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDevices}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredDevices}
          renderItem={renderDeviceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No se encontraron dispositivos</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    opacity: 0.3,
  },
  headerContent: {
    position: 'relative',
    zIndex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: COLORS.WHITE,
    fontSize: 14,
    opacity: 0.85,
    fontWeight: '400',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.GRAY_MEDIUM,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    height: 52,
    fontSize: 15,
    color: COLORS.BLACK,
    fontWeight: '500',
    marginLeft: 10,
  },
  searchIconLeft: {
    marginLeft: 0,
  },
  listContainer: {
    padding: 20,
    paddingTop: 8,
  },
  deviceItem: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 0,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.GRAY_MEDIUM,
    overflow: 'hidden',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  deviceItemSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY + '05',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  deviceContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 80,
  },
  colorSection: {
    width: 70,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSectionSelected: {
    backgroundColor: COLORS.PRIMARY,
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceIconContainerSelected: {
    backgroundColor: COLORS.WHITE + '40',
  },
  deviceInfo: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 16,
    paddingRight: 12,
    justifyContent: 'center',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.BLACK,
    marginBottom: 3,
    letterSpacing: 0.1,
  },
  deviceNameSelected: {
    color: COLORS.PRIMARY,
    fontWeight: '700',
  },
  deviceCode: {
    fontSize: 12,
    color: COLORS.GRAY_DARK,
    fontWeight: '400',
  },
  deviceUnit: {
    fontSize: 11,
    color: COLORS.GRAY_DARK,
    fontWeight: '400',
    marginTop: 2,
  },
  arrowContainer: {
    paddingRight: 16,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.GRAY_DARK,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.GRAY_DARK,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  retryButtonText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '600',
  },
  bleButton: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  bleButtonText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  bleError: {
    marginHorizontal: 20,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3F3',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  bleErrorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.ERROR,
  },
  qrContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  qrCamera: {
    flex: 1,
  },
  qrOverlay: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 20,
  },
  qrHint: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  qrClose: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
});
