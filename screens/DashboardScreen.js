import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { getTrackers, getCustomerAssets, getTripsHistory } from '../services/apiService';

export default function DashboardScreen({ onNavigate, onLogout, user }) {
  const [sensorCount, setSensorCount] = useState(0);
  const [tripCount, setTripCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const displayName = user?.name || 'Usuario';

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    setLoading(true);
    try {
      const customerId = user?.customerId;
      if (!customerId) return;

      const devices = await getTrackers(customerId);
      setSensorCount(devices?.length || 0);

      const customerName = user?.customerName;
      if (!customerName) return;
      const assetsResponse = await getCustomerAssets(customerId);
      const assets = assetsResponse?.data || [];
      const tienda = assets.find((a) => a.name === customerName);
      if (!tienda) return;
      const tiendaId = tienda.id?.id || tienda.id;

      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      const data = await getTripsHistory(tiendaId, thirtyDaysAgo, now);
      const trips = data?.reportevehiculo || [];
      setTripCount(trips.length);
    } catch (e) {
      console.error('Error cargando conteo:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerGradient} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerGreeting}>
                Bienvenido <Text style={styles.headerUserName}>{displayName}</Text>
              </Text>
              <Image
                source={require('../assets/qtrace.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={onLogout}
              activeOpacity={0.7}
            >
              <Feather name="log-out" size={20} color={COLORS.WHITE} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>Panel de control</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.statsLoading}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.statsLoadingText}>Cargando información...</Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <View style={styles.statIconContainer}>
                <Feather name="truck" size={24} color={COLORS.PRIMARY} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{tripCount}</Text>
                <Text style={styles.statLabel} numberOfLines={1}>Viajes</Text>
              </View>
            </View>
            <View style={[styles.statCard, styles.statCardSecondary]}>
              <View style={[styles.statIconContainer, { backgroundColor: COLORS.SUCCESS + '15' }]}>
                <Feather name="radio" size={24} color={COLORS.SUCCESS} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{sensorCount}</Text>
                <Text style={styles.statLabel} numberOfLines={1}>Sensores</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardTrips]}
            onPress={() => onNavigate('trips')}
            activeOpacity={0.9}
          >
            <View style={styles.actionCardContent}>
              <View style={styles.actionCardLeft}>
                <View style={[styles.actionIconContainer, styles.actionIconTrips]}>
                  <Feather name="list" size={28} color={COLORS.PRIMARY} />
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Lista de Viajes</Text>
                  <Text style={styles.actionDescription}>
                    Ver y gestionar todos tus viajes registrados
                  </Text>
                </View>
              </View>
              <View style={styles.actionArrowContainer}>
                <Feather name="chevron-right" size={24} color={COLORS.PRIMARY} />
              </View>
            </View>
            <View style={styles.actionCardAccent} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardReport]}
            onPress={() => onNavigate('devices')}
            activeOpacity={0.9}
          >
            <View style={styles.actionCardContent}>
              <View style={styles.actionCardLeft}>
                <View style={[styles.actionIconContainer, styles.actionIconReport]}>
                  <Feather name="file-text" size={28} color={COLORS.SUCCESS} />
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Reconstruir Viaje</Text>
                  <Text style={styles.actionDescription}>
                    Crear un nuevo reporte de viaje
                  </Text>
                </View>
              </View>
              <View style={styles.actionArrowContainer}>
                <Feather name="chevron-right" size={24} color={COLORS.SUCCESS} />
              </View>
            </View>
            <View style={[styles.actionCardAccent, styles.actionCardAccentReport]} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: 30,
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerGreeting: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.9,
    marginBottom: 4,
  },
  headerUserName: {
    fontWeight: '700',
  },
  headerLogo: {
    width: 140,
    height: 44,
    marginTop: 4,
  },
  headerSubtitle: {
    color: COLORS.WHITE,
    fontSize: 15,
    opacity: 0.85,
    fontWeight: '400',
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 16,
  },
  statsLoading: {
    marginBottom: 32,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.GRAY_DARK,
    fontWeight: '500',
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 0,
  },
  statCardPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  statCardSecondary: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.SUCCESS,
  },
  statIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.PRIMARY + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  statContent: {
    flex: 1,
    minWidth: 0,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.BLACK,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.GRAY_DARK,
    fontWeight: '500',
    flexShrink: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.BLACK,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  actionCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  actionCardTrips: {
    borderTopWidth: 3,
    borderTopColor: COLORS.PRIMARY,
  },
  actionCardReport: {
    borderTopWidth: 3,
    borderTopColor: COLORS.SUCCESS,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 22,
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  actionIconTrips: {
    backgroundColor: COLORS.PRIMARY + '15',
  },
  actionIconReport: {
    backgroundColor: COLORS.SUCCESS + '15',
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.BLACK,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  actionDescription: {
    fontSize: 14,
    color: COLORS.GRAY_DARK,
    lineHeight: 20,
    fontWeight: '400',
  },
  actionArrowContainer: {
    marginLeft: 12,
  },
  actionCardAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.PRIMARY,
    opacity: 0.3,
  },
  actionCardAccentReport: {
    backgroundColor: COLORS.SUCCESS,
  },
});
