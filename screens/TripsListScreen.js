import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { COLORS } from '../constants/colors';
import CustomDateTimePicker from '../components/DateTimePicker';
import { getTripsHistory, getCustomerAssets } from '../services/apiService';

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(2);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

function calcDuration(start, end) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e)) return 'N/A';
  const totalMin = Math.max(0, Math.floor((e - s) / 60000));
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatTemp(t) {
  if (t === null || t === undefined) return 'N/A';
  return `${Number(t).toFixed(1)}°C`;
}

function parseTripsFromTelemetry(data) {
  const raw = data?.reportevehiculo || data?.temperature || [];
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item, idx) => {
      try {
        const parsed = JSON.parse(item.value);
        const viaje = parsed.reconstruir_viaje || parsed;
        return {
          id: `${item.ts}-${idx}`,
          timestamp: item.ts,
          dispositivoId: viaje.dispositivo_id,
          dispositivoName: viaje.dispositivo_name,
          dispositivoNombreSensor: viaje.dispositivo_nombre_sensor,
          codigoDespacho: viaje.codigo_despacho,
          liberadoPor: viaje.liberado_por,
          perfilCarga: viaje.perfil_carga,
          fechaInicio: viaje.fecha_inicio,
          fechaTermino: viaje.fecha_termino,
          origenRuta: viaje.origen_ruta,
          destinoRuta: viaje.destino_ruta,
          temperaturaInicio: viaje.temperatura_inicio ?? null,
          temperaturaFin: viaje.temperatura_fin ?? null,
          temperaturaPromedio: viaje.temperatura_promedio ?? null,
          pdfBase64: parsed.pdfBase64 || null,
          viajesAlerts: viaje.viajesAlerts || parsed.viajesAlerts || [],
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.timestamp - a.timestamp);
}

function parseAlerts(raw) {
  if (!raw) return [];
  let list = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === 'string') {
    list = raw.split(/\r?\n/).filter(Boolean);
  }
  return list.map((a) => {
    if (typeof a === 'object' && a !== null) {
      return {
        temp: a.temperatura ?? a.temp ?? '',
        start: a.fechaInicio ?? a.start ?? '',
        end: a.fechaTermino ?? a.end ?? '',
      };
    }
    if (typeof a === 'string') {
      const parts = a.split('|').map((p) => p.trim());
      return { temp: parts[0] || '', start: parts[1] || '', end: parts[2] || '' };
    }
    return { temp: '', start: '', end: '' };
  });
}

export default function TripsListScreen({ onNavigate, user }) {
  const [trips, setTrips] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [dateTo, setDateTo] = useState(() => new Date());
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(null);
  const [assetId, setAssetId] = useState(null);

  useEffect(() => {
    resolveAssetAndLoad();
  }, []);

  const resolveAssetAndLoad = async () => {
    setLoading(true);
    setError(null);
    try {
      const customerId = user?.customerId;
      if (!customerId) throw new Error('No se encontró el ID del cliente');

      const customerName = user?.customerName;
      if (!customerName) throw new Error('No se encontró el nombre del cliente');

      const assetsResponse = await getCustomerAssets(customerId);
      const assets = assetsResponse?.data || [];
      if (assets.length === 0) throw new Error('No se encontraron activos para este cliente');

      const tiendaAsset = assets.find((a) => a.name === customerName);
      if (!tiendaAsset) throw new Error(`No se encontró el activo "${customerName}"`);

      const tiendaId = tiendaAsset.id?.id || tiendaAsset.id;
      if (!tiendaId) throw new Error('No se pudo obtener el ID del activo');

      console.log('Tienda asset:', tiendaAsset.name, 'ID:', tiendaId);
      setAssetId(tiendaId);
      await loadTrips(tiendaId);
    } catch (e) {
      console.error('Error resolviendo asset:', e);
      setError('No se pudieron cargar los viajes.');
    } finally {
      setLoading(false);
    }
  };

  const loadTrips = async (aId) => {
    const id = aId || assetId;
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const startTs = dateFrom.getTime();
      const endTs = dateTo.getTime();
      const data = await getTripsHistory(id, startTs, endTs);
      const parsed = parseTripsFromTelemetry(data);
      setTrips(parsed);
      applyFilters(parsed, search);
    } catch (e) {
      console.error('Error cargando viajes:', e);
      setError('Error al cargar el historial.');
      setTrips([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback((data, query) => {
    if (!query.trim()) {
      setFiltered(data);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      data.filter(
        (t) =>
          (t.codigoDespacho || '').toLowerCase().includes(q) ||
          (t.dispositivoNombreSensor || '').toLowerCase().includes(q) ||
          (t.dispositivoName || '').toLowerCase().includes(q) ||
          (t.origenRuta || '').toLowerCase().includes(q) ||
          (t.destinoRuta || '').toLowerCase().includes(q) ||
          (t.liberadoPor || '').toLowerCase().includes(q)
      )
    );
  }, []);

  useEffect(() => {
    applyFilters(trips, search);
  }, [search, trips, applyFilters]);

  const handleRefresh = () => loadTrips();

  const handleDateChange = (field, date) => {
    if (field === 'from') setDateFrom(date);
    else setDateTo(date);
  };

  useEffect(() => {
    if (assetId) loadTrips();
  }, [dateFrom, dateTo]);

  const openDetail = (trip) => {
    setSelectedTrip(trip);
    setModalVisible(true);
  };

  const handleDownloadPdf = async (trip) => {
    if (!trip.pdfBase64) {
      Alert.alert('Sin PDF', 'No hay PDF disponible para este viaje.');
      return;
    }
    setDownloadingPdf(trip.id);
    try {
      const safeName = `viaje_${Date.now()}.pdf`;
      const pdfFile = new File(Paths.cache, safeName);
      pdfFile.create({ overwrite: true });
      const binaryString = atob(trip.pdfBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      pdfFile.write(bytes);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(pdfFile.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Reporte de viaje',
        });
      }
    } catch (e) {
      console.error('Error descargando PDF:', e);
      Alert.alert('Error', 'No se pudo abrir el PDF.');
    } finally {
      setDownloadingPdf(null);
    }
  };

  const renderTripItem = ({ item }) => {
    const alerts = parseAlerts(item.viajesAlerts);
    return (
      <TouchableOpacity
        style={styles.tripCard}
        onPress={() => openDetail(item)}
        activeOpacity={0.7}
      >
        <View style={styles.tripHeader}>
          <View style={styles.tripHeaderLeft}>
            <Text style={styles.dispatchCode}>
              {item.codigoDespacho || 'Sin código'}
            </Text>
            <Text style={styles.deviceName}>
              {item.dispositivoNombreSensor || item.dispositivoName || 'N/A'}
            </Text>
          </View>
          {alerts.length > 0 ? (
            <View style={styles.alertBadge}>
              <Feather name="alert-triangle" size={12} color={COLORS.ERROR} />
              <Text style={styles.alertBadgeText}>{alerts.length}</Text>
            </View>
          ) : (
            <View style={styles.okBadge}>
              <Feather name="check-circle" size={12} color={COLORS.SUCCESS} />
              <Text style={styles.okBadgeText}>OK</Text>
            </View>
          )}
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.routeItem}>
            <Text style={styles.routeLabel}>Origen</Text>
            <Text style={styles.routeValue} numberOfLines={1}>
              {item.origenRuta || 'N/A'}
            </Text>
          </View>
          <Text style={styles.routeArrow}>→</Text>
          <View style={styles.routeItem}>
            <Text style={styles.routeLabel}>Destino</Text>
            <Text style={styles.routeValue} numberOfLines={1}>
              {item.destinoRuta || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.dateContainer}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Inicio</Text>
            <Text style={styles.dateValue}>{formatDate(item.fechaInicio)}</Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Término</Text>
            <Text style={styles.dateValue}>{formatDate(item.fechaTermino)}</Text>
          </View>
        </View>

        {item.pdfBase64 ? (
          <TouchableOpacity
            style={styles.pdfButton}
            onPress={() => handleDownloadPdf(item)}
            activeOpacity={0.8}
            disabled={downloadingPdf === item.id}
          >
            {downloadingPdf === item.id ? (
              <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            ) : (
              <>
                <Feather name="file-text" size={16} color={COLORS.PRIMARY} />
                <Text style={styles.pdfButtonText}>Descargar PDF</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    );
  };

  const DetailModal = () => {
    if (!selectedTrip) return null;
    const trip = selectedTrip;
    const alerts = parseAlerts(trip.viajesAlerts);

    return (
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalle del Viaje</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={COLORS.GRAY_DARK} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.modalScroll}
            >
              <Text style={styles.modalSectionTitle}>Información General</Text>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Código Despacho</Text>
                <Text style={styles.modalValue}>{trip.codigoDespacho || 'N/A'}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Dispositivo</Text>
                <Text style={styles.modalValue}>
                  {trip.dispositivoNombreSensor || trip.dispositivoName || 'N/A'}
                </Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Liberado por</Text>
                <Text style={styles.modalValue}>{trip.liberadoPor || 'N/A'}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Perfil de carga</Text>
                <Text style={styles.modalValue}>{trip.perfilCarga || 'N/A'}</Text>
              </View>

              <View style={styles.modalDivider} />
              <Text style={styles.modalSectionTitle}>Ruta y Período</Text>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Origen</Text>
                <Text style={styles.modalValue}>{trip.origenRuta || 'N/A'}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Destino</Text>
                <Text style={styles.modalValue}>{trip.destinoRuta || 'N/A'}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Inicio</Text>
                <Text style={styles.modalValue}>{formatDate(trip.fechaInicio)}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Término</Text>
                <Text style={styles.modalValue}>{formatDate(trip.fechaTermino)}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Duración</Text>
                <Text style={styles.modalValue}>
                  {calcDuration(trip.fechaInicio, trip.fechaTermino)}
                </Text>
              </View>

              <View style={styles.modalDivider} />
              <Text style={styles.modalSectionTitle}>Temperaturas</Text>
              <View style={styles.tempRow}>
                <View style={styles.tempCard}>
                  <Text style={styles.tempLabel}>Inicio</Text>
                  <Text style={styles.tempValue}>{formatTemp(trip.temperaturaInicio)}</Text>
                </View>
                <View style={styles.tempCard}>
                  <Text style={styles.tempLabel}>Fin</Text>
                  <Text style={styles.tempValue}>{formatTemp(trip.temperaturaFin)}</Text>
                </View>
                <View style={styles.tempCard}>
                  <Text style={styles.tempLabel}>Promedio</Text>
                  <Text style={styles.tempValue}>{formatTemp(trip.temperaturaPromedio)}</Text>
                </View>
              </View>

              <View style={styles.modalDivider} />
              <Text style={styles.modalSectionTitle}>
                Alertas ({alerts.length})
              </Text>
              {alerts.length === 0 ? (
                <View style={styles.noAlerts}>
                  <Feather name="check-circle" size={20} color={COLORS.SUCCESS} />
                  <Text style={styles.noAlertsText}>Sin alertas registradas</Text>
                </View>
              ) : (
                alerts.map((a, i) => (
                  <View key={i} style={styles.alertItem}>
                    <Feather name="alert-triangle" size={14} color={COLORS.ERROR} />
                    <Text style={styles.alertItemText}>
                      {a.temp} | {a.start} | {a.end}
                    </Text>
                  </View>
                ))
              )}

              {trip.pdfBase64 ? (
                <TouchableOpacity
                  style={styles.modalPdfButton}
                  onPress={() => {
                    setModalVisible(false);
                    setTimeout(() => handleDownloadPdf(trip), 300);
                  }}
                  activeOpacity={0.8}
                >
                  <Feather name="download" size={18} color={COLORS.WHITE} />
                  <Text style={styles.modalPdfButtonText}>Descargar PDF</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => onNavigate('dashboard')}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={COLORS.WHITE} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Lista de Viajes</Text>
          <Text style={styles.headerSubtitle}>
            {loading
              ? 'Cargando...'
              : `${filtered.length} viaje${filtered.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Feather name="refresh-cw" size={18} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.searchRow}>
          <Feather name="search" size={18} color={COLORS.GRAY_DARK} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por código, sensor, ruta..."
            placeholderTextColor={COLORS.GRAY_DARK}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x-circle" size={18} color={COLORS.GRAY_DARK} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.dateFiltersRow}>
          <View style={styles.dateFilterItem}>
            <CustomDateTimePicker
              label="Desde"
              value={dateFrom}
              onChange={(d) => handleDateChange('from', d)}
              placeholder="Desde"
            />
          </View>
          <View style={styles.dateFilterItem}>
            <CustomDateTimePicker
              label="Hasta"
              value={dateTo}
              onChange={(d) => handleDateChange('to', d)}
              placeholder="Hasta"
            />
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Cargando viajes...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Feather name="alert-circle" size={48} color={COLORS.ERROR} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Feather name="inbox" size={48} color={COLORS.GRAY_DARK} />
              <Text style={styles.emptyText}>
                No hay viajes en el período seleccionado
              </Text>
            </View>
          }
        />
      )}

      <DetailModal />
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
    paddingBottom: 20,
    paddingHorizontal: 20,
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
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: COLORS.WHITE,
    fontSize: 14,
    opacity: 0.9,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.GRAY_MEDIUM,
    marginBottom: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.BLACK,
    marginLeft: 10,
    fontWeight: '500',
  },
  dateFiltersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateFilterItem: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
    paddingTop: 8,
  },
  tripCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.GRAY_MEDIUM,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  tripHeaderLeft: {
    flex: 1,
  },
  dispatchCode: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.PRIMARY,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  deviceName: {
    fontSize: 14,
    color: COLORS.GRAY_DARK,
    fontWeight: '500',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.ERROR + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ERROR,
  },
  okBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.SUCCESS + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  okBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.SUCCESS,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.GRAY_MEDIUM,
  },
  routeItem: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    color: COLORS.GRAY_DARK,
    marginBottom: 3,
    fontWeight: '500',
  },
  routeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.BLACK,
  },
  routeArrow: {
    fontSize: 22,
    color: COLORS.PRIMARY,
    marginHorizontal: 10,
    fontWeight: 'bold',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: COLORS.GRAY_DARK,
    marginBottom: 3,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 13,
    color: COLORS.BLACK,
    fontWeight: '500',
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY + '08',
  },
  pdfButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
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
    marginTop: 4,
  },
  retryButtonText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_MEDIUM,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.PRIMARY,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginBottom: 12,
    marginTop: 4,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalLabel: {
    fontSize: 14,
    color: COLORS.GRAY_DARK,
    fontWeight: '500',
    flex: 1,
  },
  modalValue: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  modalDivider: {
    height: 1,
    backgroundColor: COLORS.GRAY_MEDIUM,
    marginVertical: 16,
  },
  tempRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tempCard: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY + '10',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  tempLabel: {
    fontSize: 11,
    color: COLORS.GRAY_DARK,
    fontWeight: '500',
    marginBottom: 4,
  },
  tempValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  noAlerts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.SUCCESS + '10',
    borderRadius: 12,
  },
  noAlertsText: {
    fontSize: 14,
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.ERROR + '08',
    borderRadius: 10,
    marginBottom: 6,
  },
  alertItemText: {
    fontSize: 13,
    color: COLORS.BLACK,
    fontWeight: '500',
    flex: 1,
  },
  modalPdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.PRIMARY,
  },
  modalPdfButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
});
