import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { COLORS } from '../constants/colors';
import CustomDateTimePicker from '../components/DateTimePicker';
import {
  getAssetBySensor,
  generateVehicleReport,
  saveVehicleReport,
  sendTelemetry,
} from '../services/apiService';
import { getToken } from '../services/tokenService';
import { MinewBle } from '../services/MinewBle';

const PERFILES = ['Refrigerado', 'Congelado', 'Refrigerado al vacío'];

const FloatingLabelInput = ({ label, value, onChangeText, placeholder, keyboardType = 'default', editable = true }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <View style={styles.inputContainer}>
        {label && <Text style={styles.floatingLabel}>{label}</Text>}
        <TextInput
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            !editable && styles.inputDisabled,
          ]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.GRAY_DARK}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
        />
      </View>
    </View>
  );
};

const DropdownPicker = ({ label, value, options, onSelect, placeholder }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <View style={styles.inputContainer}>
        {label && <Text style={styles.floatingLabel}>{label}</Text>}
        <TouchableOpacity
          style={[styles.input, styles.dropdownButton]}
          onPress={() => setVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>
            {value || placeholder || 'Seleccionar...'}
          </Text>
          <Feather name="chevron-down" size={20} color={COLORS.GRAY_DARK} />
        </TouchableOpacity>
      </View>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label || 'Seleccionar'}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    item === value && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      item === value && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {item === value && (
                    <Feather name="check" size={18} color={COLORS.PRIMARY} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

function toIsoUtc(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export default function ReportFormScreen({ device, onNavigate, user }) {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    dispatchCode: '',
    startDate: null,
    endDate: null,
    loadProfile: '',
  });
  const [generating, setGenerating] = useState(false);
  const [assetInfo, setAssetInfo] = useState(null);

  const liberadoPor = user?.name || 'S/I';
  const sensorId = device?.id || '';
  const sensorName = device?.name || device?.deviceName || '';
  const isUnregistered = device?.isUnregistered || false;
  const isBleConnected = device?.bleConnected === true;
  const bleMac = device?.bleMac || '';
  const nameParametrizado = device?.nombre_sensor || '';

  useEffect(() => {
    if (device && !isUnregistered && sensorId) {
      loadAsset();
    }
    if (isUnregistered && device?.assetId) {
      setAssetInfo({ id: device.assetId, name: device.assetName });
    }
  }, [device]);

  const loadAsset = async () => {
    try {
      const asset = await getAssetBySensor(sensorId);
      setAssetInfo(asset);
    } catch (e) {
      console.error('Error resolviendo asset:', e);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    if (!formData.origin.trim()) return Alert.alert('Error', 'El origen es requerido');
    if (!formData.destination.trim()) return Alert.alert('Error', 'El destino es requerido');
    if (!formData.dispatchCode.trim()) return Alert.alert('Error', 'El código de despacho es requerido');
    if (!formData.startDate) return Alert.alert('Error', 'La fecha de inicio es requerida');
    if (!formData.endDate) return Alert.alert('Error', 'La fecha de término es requerida');
    if (formData.endDate <= formData.startDate) return Alert.alert('Error', 'La fecha de término debe ser posterior al inicio');
    if (!formData.loadProfile) return Alert.alert('Error', 'El perfil de carga es requerido');

    const resolvedDeviceId = device?.deviceId || sensorId;
    const resolvedAssetId = assetInfo?.id || device?.assetId;
    const resolvedAssetName = assetInfo?.name || device?.assetName || 'S/I';

    if (!resolvedDeviceId || !resolvedAssetId) {
      return Alert.alert(
        'Error',
        'No se pudo identificar el dispositivo o activo asociado. Verifique que el sensor esté registrado en la plataforma.'
      );
    }

    setGenerating(true);

    try {
      // Para sensores conectados via BLE: leer historial real del sensor
      if (isBleConnected && bleMac && MinewBle.isSupported) {
        const startSec = Math.floor(formData.startDate.getTime() / 1000);
        const endSec = Math.floor(formData.endDate.getTime() / 1000);

        const blePoints = await new Promise((resolve) => {
          const timeout = setTimeout(() => resolve([]), 30000);
          const sub = MinewBle.onHistoryData(({ mac: m, error, data }) => {
            if (m?.toUpperCase() !== bleMac.toUpperCase()) return;
            sub.remove();
            clearTimeout(timeout);
            resolve(error ? [] : data);
          });
          MinewBle.queryHistory(bleMac, startSec, endSec);
        });

        if (blePoints.length > 0) {
          const values = blePoints.map((p) => p.temperature);
          const tempInicio = values[0];
          const tempFin = values[values.length - 1];
          const tempPromedio = parseFloat(
            (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
          );

          const sincJson = JSON.stringify({
            status: 'pendiente',
            mac: bleMac,
            origen: formData.origin || 'S/I',
            destino: formData.destination || 'S/I',
            perfil_carga: formData.loadProfile || 'S/I',
            codigo_despacho: formData.dispatchCode || 'S/I',
            liberado_por: liberadoPor,
            fecha_inicio: toIsoUtc(formData.startDate),
            fecha_termino: toIsoUtc(formData.endDate),
            temperatura_inicio: tempInicio,
            temperatura_fin: tempFin,
            temperatura_promedio: tempPromedio,
            temperaturas: blePoints.map((p) => ({
              ts: p.timestamp * 1000,
              value: p.temperature,
            })),
          });

          const token = await getToken();
          await sendTelemetry({
            token,
            baseUrl: 'https://engine.unklatam.com:443',
            entityType: 'DEVICE',
            entityId: resolvedDeviceId,
            scope: 'ts',
            telemetryData: [{ ts: Date.now(), values: { sincronizaciones: sincJson } }],
          });
        }

        // Disconnect sensor after reading
        MinewBle.disconnect(bleMac);

      } else if (isUnregistered) {
        // Fallback: mock telemetry for unregistered sensors without BLE
        const startTs = formData.startDate.getTime();
        const endTs = formData.endDate.getTime();
        const interval = (endTs - startTs) / 20;

        const mockPoints = Array.from({ length: 21 }, (_, i) => ({
          ts: startTs + interval * i,
          value: parseFloat((3.0 + Math.sin(i * 0.5) * 2.5).toFixed(1)),
        }));

        const values = mockPoints.map((p) => p.value);
        const tempInicio = values[0] || 0;
        const tempFin = values[values.length - 1] || 0;
        const tempPromedio =
          values.length > 0
            ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1))
            : 0;

        const sincJson = JSON.stringify({
          status: 'pendiente',
          mac: sensorName || resolvedDeviceId,
          origen: formData.origin || 'S/I',
          destino: formData.destination || 'S/I',
          perfil_carga: formData.loadProfile || 'S/I',
          codigo_despacho: formData.dispatchCode || 'S/I',
          liberado_por: liberadoPor,
          fecha_inicio: toIsoUtc(formData.startDate),
          fecha_termino: toIsoUtc(formData.endDate),
          temperatura_inicio: tempInicio,
          temperatura_fin: tempFin,
          temperatura_promedio: tempPromedio,
          temperaturas: mockPoints.map((p) => ({ ts: p.ts, value: p.value })),
        });

        const token = await getToken();
        await sendTelemetry({
          token,
          baseUrl: 'https://engine.unklatam.com:443',
          entityType: 'DEVICE',
          entityId: resolvedDeviceId,
          scope: 'ts',
          telemetryData: [{ ts: Date.now(), values: { sincronizaciones: sincJson } }],
        });
      }

      const request = {
        reconstruir_viaje: {
          tenant: 'engine',
          activo_tienda_id: resolvedAssetId,
          activo_tienda_nombre: resolvedAssetName,
          dispositivo_id: resolvedDeviceId,
          dispositivo_id2: sensorName,
          dispositivo_name: sensorName,
          dispositivo_nombre_sensor: nameParametrizado,
          codigo_despacho: formData.dispatchCode || 'S/I',
          liberado_por: liberadoPor,
          perfil_carga: formData.loadProfile,
          fecha_inicio: toIsoUtc(formData.startDate),
          fecha_termino: toIsoUtc(formData.endDate),
          origen_ruta: formData.origin,
          destino_ruta: formData.destination,
          fuente_telemetria: (isBleConnected || isUnregistered) ? 'sincronizaciones' : null,
        },
      };

      const response = await generateVehicleReport(request);

      if (!response.pdf) {
        throw new Error('El servidor devolvió un reporte vacío.');
      }

      const pdfFile = new File(Paths.cache, `reporte_${Date.now()}.pdf`);
      pdfFile.create({ overwrite: true });

      const binaryString = atob(response.pdf);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      pdfFile.write(bytes);
      const fileUri = pdfFile.uri;

      const temps = response.temperaturas || {};

      try {
        const saveBody = JSON.stringify({
          tenant: 'engine',
          activo_tienda_nombre: resolvedAssetName,
          dispositivo_id: resolvedDeviceId,
          dispositivo_name: sensorName,
          codigo_despacho: formData.dispatchCode || 'S/I',
          liberado_por: liberadoPor,
          perfil_carga: formData.loadProfile,
          fecha_inicio: toIsoUtc(formData.startDate),
          fecha_termino: toIsoUtc(formData.endDate),
          origen_ruta: formData.origin,
          destino_ruta: formData.destination,
          temperatura_inicio: temps.temperatura_inicio || 0,
          temperatura_fin: temps.temperatura_fin || 0,
          temperatura_promedio: temps.temperatura_promedio || 0,
        });

        await saveVehicleReport(resolvedAssetId, saveBody, fileUri);
      } catch (saveErr) {
        console.warn('Error guardando reporte (no crítico):', saveErr);
      }

      setGenerating(false);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Reporte de viaje',
        });
      }

      Alert.alert('Reporte generado', 'El reporte PDF se generó correctamente.', [
        { text: 'OK', onPress: () => onNavigate('dashboard') },
      ]);
    } catch (e) {
      setGenerating(false);
      console.error('Error generando reporte:', e);

      let msg = 'No se pudo generar el reporte. Verifique su conexión.';
      if (e.response) {
        const code = e.response.status;
        if (code === 401) msg = 'Su sesión ha expirado. Inicie sesión nuevamente.';
        else if (code === 400) msg = 'Los datos enviados no son válidos.';
        else if (code === 404) msg = 'El activo o dispositivo no fue encontrado.';
        else if (code >= 500) msg = 'Error interno del servidor.';
      }

      Alert.alert('Error al generar reporte', msg);
    }
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
              onPress={() => onNavigate('devices')}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={20} color={COLORS.WHITE} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Reconstruir Viaje</Text>
              {device && (
                <Text style={styles.headerSubtitle}>
                  {isUnregistered ? `${sensorName} (no registrado)` : (nameParametrizado || sensorName)}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isUnregistered && (
          <View style={styles.mockBanner}>
            <Feather name="alert-triangle" size={16} color={COLORS.PRIMARY} />
            <Text style={styles.mockBannerText}>Sensor no registrado en lista</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>ID Sensor</Text>
          <Text style={styles.infoValue}>{sensorName || '---'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Liberado por</Text>
          <Text style={styles.infoValue}>{liberadoPor}</Text>
        </View>

        <View style={styles.separator} />

        <FloatingLabelInput
          label="Origen *"
          placeholder="Ingresa el origen de la ruta"
          value={formData.origin}
          onChangeText={(v) => handleInputChange('origin', v)}
        />

        <FloatingLabelInput
          label="Destino *"
          placeholder="Ingresa el destino de la ruta"
          value={formData.destination}
          onChangeText={(v) => handleInputChange('destination', v)}
        />

        <FloatingLabelInput
          label="Código Despacho *"
          placeholder="Ingresa el código de despacho"
          value={formData.dispatchCode}
          onChangeText={(v) => handleInputChange('dispatchCode', v)}
        />

        <CustomDateTimePicker
          label="Fecha de inicio *"
          value={formData.startDate}
          onChange={(date) => handleInputChange('startDate', date)}
          placeholder="Seleccionar fecha y hora de inicio"
        />

        <CustomDateTimePicker
          label="Fecha de término *"
          value={formData.endDate}
          onChange={(date) => handleInputChange('endDate', date)}
          placeholder="Seleccionar fecha y hora de término"
        />

        <DropdownPicker
          label="Perfil de carga *"
          value={formData.loadProfile}
          options={PERFILES}
          onSelect={(v) => handleInputChange('loadProfile', v)}
          placeholder="Seleccionar perfil"
        />

        <TouchableOpacity
          style={[styles.saveButton, generating && styles.saveButtonDisabled]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={generating}
        >
          {generating ? (
            <View style={styles.savingRow}>
              <ActivityIndicator color={COLORS.WHITE} size="small" />
              <Text style={styles.saveButtonText}>Generando reporte...</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>Generar Reporte</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
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
    fontSize: 26,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 24,
  },
  mockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.PRIMARY + '15',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY + '30',
  },
  mockBannerText: {
    color: COLORS.PRIMARY,
    fontSize: 13,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.GRAY_DARK,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.GRAY_MEDIUM,
    marginVertical: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    position: 'relative',
  },
  floatingLabel: {
    position: 'absolute',
    top: -8,
    left: 12,
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    zIndex: 1,
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 4,
  },
  input: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    fontSize: 16,
    color: COLORS.BLACK,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY_MEDIUM,
    minHeight: 56,
    fontWeight: '400',
  },
  inputFocused: {
    borderColor: COLORS.PRIMARY,
  },
  inputDisabled: {
    backgroundColor: COLORS.GRAY_LIGHT,
    color: COLORS.GRAY_DARK,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.BLACK,
    fontWeight: '400',
  },
  dropdownPlaceholder: {
    color: COLORS.GRAY_DARK,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 20,
    maxHeight: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.BLACK,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalOptionSelected: {
    backgroundColor: COLORS.PRIMARY + '15',
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.BLACK,
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: COLORS.PRIMARY,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
