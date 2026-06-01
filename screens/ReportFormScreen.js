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
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LineChart } from 'react-native-chart-kit';
import { COLORS } from '../constants/colors';
import CustomDateTimePicker from '../components/DateTimePicker';
import {
  getAssetBySensor,
  generateVehicleReport,
  saveVehicleReport,
  sendTelemetry,
  sendDeviceTelemetry,
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

const SCREEN_WIDTH = Dimensions.get('window').width;

// Reduce los puntos a como máximo `max` para que el gráfico no se sature.
function downsample(points, max = 40) {
  if (points.length <= max) return points;
  const step = points.length / max;
  const out = [];
  for (let i = 0; i < max; i++) out.push(points[Math.floor(i * step)]);
  out.push(points[points.length - 1]);
  return out;
}

function getThreshold(loadProfile) {
  switch (loadProfile) {
    case 'Refrigerado':          return 5;
    case 'Congelado':            return -18;
    case 'Refrigerado al vacío': return 2;
    default:                     return null;
  }
}

// points: [{timestamp (segundos), temperature}]
function detectAlerts(points, limit) {
  if (limit === null || points.length === 0) return [];
  const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);
  const alerts = [];
  let start = null;
  let max = -Infinity;
  const endTs = sorted[sorted.length - 1].timestamp;
  for (const p of sorted) {
    const temp = p.temperature;
    if (temp > limit) {
      if (start === null) start = p.timestamp;
      if (temp > max) max = temp;
    } else if (start !== null) {
      alerts.push({ maxTemp: max, startTime: start, endTime: p.timestamp });
      start = null; max = -Infinity;
    }
  }
  if (start !== null) alerts.push({ maxTemp: max, startTime: start, endTime: endTs });
  return alerts;
}

function formatAlert({ maxTemp, startTime, endTime }) {
  const fmt = (ts) => {
    const d = new Date(ts * 1000);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  return `${maxTemp.toFixed(1)}°C | ${fmt(startTime)} | ${fmt(endTime)}`;
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
  const [querying, setQuerying] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null); // { points, tempInicio, tempFin, tempPromedio }
  const [pendingShareUri, setPendingShareUri] = useState(null); // PDF a compartir tras cerrar el modal
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

  // Paso 1: validar, consultar el sensor y abrir la vista previa.
  const handlePreview = async () => {
    if (!formData.origin.trim()) return Alert.alert('Error', 'El origen es requerido');
    if (!formData.destination.trim()) return Alert.alert('Error', 'El destino es requerido');
    if (!formData.dispatchCode.trim()) return Alert.alert('Error', 'El código de despacho es requerido');
    if (!formData.startDate) return Alert.alert('Error', 'La fecha de inicio es requerida');
    if (!formData.endDate) return Alert.alert('Error', 'La fecha de término es requerida');
    if (formData.endDate <= formData.startDate) return Alert.alert('Error', 'La fecha de término debe ser posterior al inicio');
    if (!formData.loadProfile) return Alert.alert('Error', 'El perfil de carga es requerido');

    const resolvedDeviceId = device?.deviceId || sensorId;
    const resolvedAssetId = assetInfo?.id || device?.assetId;

    if (!resolvedDeviceId || !resolvedAssetId) {
      return Alert.alert(
        'Error',
        'No se pudo identificar el dispositivo o activo asociado. Verifique que el sensor esté registrado en la plataforma.'
      );
    }

    setQuerying(true);
    try {
      let points = [];

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
          const htModel = device?.htModel ?? 1;
          MinewBle.queryHistory(bleMac, startSec, endSec, htModel);
        });

        points = blePoints.map((p) => ({ ts: p.timestamp * 1000, value: p.temperature }));
      } else {
        // Fallback (sensor sin BLE): genera una curva simulada solo para la vista previa.
        const startTs = formData.startDate.getTime();
        const endTs = formData.endDate.getTime();
        const interval = (endTs - startTs) / 20;
        points = Array.from({ length: 21 }, (_, i) => ({
          ts: startTs + interval * i,
          value: parseFloat((3.0 + Math.sin(i * 0.5) * 2.5).toFixed(1)),
        }));
      }

      if (points.length === 0) {
        setQuerying(false);
        return Alert.alert(
          'Sin datos',
          'No se pudieron leer lecturas del sensor en el rango seleccionado. Verifique las fechas y que el sensor esté encendido.'
        );
      }

      const values = points.map((p) => p.value);
      const tempInicio = values[0];
      const tempFin = values[values.length - 1];
      const tempPromedio = parseFloat(
        (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
      );

      const viajesAlerts = (isBleConnected && bleMac && MinewBle.isSupported)
        ? detectAlerts(
            points.map((p) => ({ timestamp: p.ts / 1000, temperature: p.value })),
            getThreshold(formData.loadProfile)
          ).map(formatAlert)
        : [];

      setPreviewData({ points, tempInicio, tempFin, tempPromedio, viajesAlerts });
      setQuerying(false);
      setPreviewVisible(true);
    } catch (e) {
      setQuerying(false);
      console.error('Error consultando sensor:', e);
      Alert.alert('Error', 'No se pudo consultar el historial del sensor.');
    }
  };

  // Paso 2: confirmar en la vista previa → subir telemetría y generar el reporte.
  const handleConfirmGenerate = async () => {
    if (!previewData) return;

    const resolvedDeviceId = device?.deviceId || sensorId;
    const resolvedAssetId = assetInfo?.id || device?.assetId;
    const resolvedAssetName = assetInfo?.name || device?.assetName || 'S/I';

    const { points, tempInicio, tempFin, tempPromedio, viajesAlerts } = previewData;

    setGenerating(true);

    try {
      if (!isUnregistered) {
        // Sensor registrado: subir lecturas reales directo a ThingsBoard.
        await sendDeviceTelemetry(resolvedDeviceId, points);
      } else {
        // Sensor no registrado: mantener el flujo de "sincronizaciones".
        const sincJson = JSON.stringify({
          status: 'pendiente',
          mac: bleMac || sensorName || resolvedDeviceId,
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
          temperaturas: points,
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
          fuente_telemetria: isUnregistered ? 'sincronizaciones' : null,
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
          viajesAlerts,
        });

        await saveVehicleReport(resolvedAssetId, saveBody, fileUri);
      } catch (saveErr) {
        console.warn('Error guardando reporte (no crítico):', saveErr);
      }

      // Reporte generado: desconectar el sensor y cerrar la vista previa.
      // El compartir / alerta se dispara en onDismiss del modal, porque iOS no
      // permite presentar el share sheet mientras el modal aún se está cerrando.
      if (isBleConnected && bleMac) MinewBle.disconnect(bleMac);
      setGenerating(false);
      setPendingShareUri(fileUri);
      setPreviewVisible(false);
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

  // Se ejecuta cuando el modal terminó de cerrarse. Recién aquí es seguro
  // presentar el share sheet y la alerta de éxito en iOS.
  const handlePreviewDismissed = async () => {
    const uri = pendingShareUri;
    if (!uri) return;
    setPendingShareUri(null);

    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Reporte de viaje',
        });
      }
    } catch (e) {
      console.warn('Error compartiendo PDF:', e);
    }

    Alert.alert('Reporte generado', 'El reporte PDF se generó correctamente.', [
      { text: 'OK', onPress: () => onNavigate('dashboard') },
    ]);
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
          style={[styles.saveButton, querying && styles.saveButtonDisabled]}
          onPress={handlePreview}
          activeOpacity={0.8}
          disabled={querying}
        >
          {querying ? (
            <View style={styles.savingRow}>
              <ActivityIndicator color={COLORS.WHITE} size="small" />
              <Text style={styles.saveButtonText}>Consultando sensor...</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>Consultar sensor</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Vista previa de la temperatura consultada */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !generating && setPreviewVisible(false)}
        onDismiss={handlePreviewDismissed}
      >
        <View style={styles.previewBackdrop}>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Vista previa del viaje</Text>
              {!generating && (
                <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                  <Feather name="x" size={22} color={COLORS.GRAY_DARK} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {previewData && (
                <>
                  <LineChart
                    data={{
                      labels: [],
                      datasets: [{ data: downsample(previewData.points).map((p) => p.value) }],
                    }}
                    width={SCREEN_WIDTH - 72}
                    height={200}
                    yAxisSuffix="°"
                    chartConfig={{
                      backgroundGradientFrom: COLORS.WHITE,
                      backgroundGradientTo: COLORS.WHITE,
                      decimalPlaces: 1,
                      color: (o = 1) => `rgba(0, 122, 255, ${o})`,
                      labelColor: () => COLORS.GRAY_DARK,
                      propsForDots: { r: '0' },
                    }}
                    bezier
                    style={styles.previewChart}
                  />

                  <View style={styles.tempRow}>
                    <View style={styles.tempCard}>
                      <Text style={styles.tempLabel}>Inicio</Text>
                      <Text style={styles.tempValue}>{previewData.tempInicio.toFixed(1)}°C</Text>
                    </View>
                    <View style={styles.tempCard}>
                      <Text style={styles.tempLabel}>Fin</Text>
                      <Text style={styles.tempValue}>{previewData.tempFin.toFixed(1)}°C</Text>
                    </View>
                    <View style={styles.tempCard}>
                      <Text style={styles.tempLabel}>Promedio</Text>
                      <Text style={styles.tempValue}>{previewData.tempPromedio.toFixed(1)}°C</Text>
                    </View>
                  </View>

                  <Text style={styles.previewHint}>
                    {previewData.points.length} lecturas en el rango seleccionado
                  </Text>

                  {previewData.viajesAlerts?.length > 0 ? (
                    <View style={styles.alertsSection}>
                      <View style={styles.alertsHeader}>
                        <Feather name="alert-triangle" size={16} color="#FF3B30" />
                        <Text style={styles.alertsTitle}>
                          {previewData.viajesAlerts.length} alerta{previewData.viajesAlerts.length > 1 ? 's' : ''} detectada{previewData.viajesAlerts.length > 1 ? 's' : ''}
                        </Text>
                      </View>
                      {previewData.viajesAlerts.map((a, i) => (
                        <View key={i} style={styles.alertItem}>
                          <Feather name="thermometer" size={13} color="#FF3B30" />
                          <Text style={styles.alertItemText}>{a}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.alertsSection}>
                      <View style={styles.alertsHeader}>
                        <Feather name="check-circle" size={16} color="#34C759" />
                        <Text style={[styles.alertsTitle, { color: '#34C759' }]}>Sin alertas</Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.previewBtn, styles.previewBtnCancel]}
                onPress={() => setPreviewVisible(false)}
                disabled={generating}
                activeOpacity={0.8}
              >
                <Text style={styles.previewBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.previewBtn, styles.previewBtnConfirm, generating && styles.saveButtonDisabled]}
                onPress={handleConfirmGenerate}
                disabled={generating}
                activeOpacity={0.8}
              >
                {generating ? (
                  <View style={styles.savingRow}>
                    <ActivityIndicator color={COLORS.WHITE} size="small" />
                    <Text style={styles.previewBtnConfirmText}>Generando...</Text>
                  </View>
                ) : (
                  <Text style={styles.previewBtnConfirmText}>Generar reporte</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  previewCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.BLACK,
  },
  previewChart: {
    borderRadius: 12,
    marginVertical: 8,
    alignSelf: 'center',
  },
  tempRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  tempCard: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY + '10',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tempLabel: {
    fontSize: 12,
    color: COLORS.GRAY_DARK,
    fontWeight: '500',
    marginBottom: 4,
  },
  tempValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  previewHint: {
    fontSize: 12,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
    marginTop: 12,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  previewBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBtnCancel: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.GRAY_DARK + '40',
  },
  previewBtnCancelText: {
    color: COLORS.GRAY_DARK,
    fontSize: 16,
    fontWeight: '600',
  },
  previewBtnConfirm: {
    backgroundColor: COLORS.PRIMARY,
  },
  previewBtnConfirmText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  alertsSection: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFD0CC',
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF3B30',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 4,
  },
  alertItemText: {
    fontSize: 13,
    color: '#CC2200',
    flex: 1,
  },
});
