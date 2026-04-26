import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/colors';

export default function MenuScreen({ onLogout }) {
  const menuOptions = [
    { id: 1, title: 'Dashboard', icon: '📊', onPress: () => console.log('Dashboard') },
    { id: 2, title: 'Dispositivos', icon: '📱', onPress: () => console.log('Dispositivos') },
    { id: 3, title: 'Reportes', icon: '📄', onPress: () => console.log('Reportes') },
    { id: 4, title: 'Configuración', icon: '⚙️', onPress: () => console.log('Configuración') },
    { id: 5, title: 'Perfil', icon: '👤', onPress: () => console.log('Perfil') },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>QTrace UNK</Text>
        <Text style={styles.headerSubtitle}>Menú Principal</Text>
      </View>

      {/* Contenido */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {menuOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.menuItem}
            onPress={option.onPress}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>{option.icon}</Text>
            <Text style={styles.menuText}>{option.title}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Botón de cerrar sesión */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={onLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    color: COLORS.WHITE,
    fontSize: 16,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.GRAY_MEDIUM,
  },
  menuIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.BLACK,
  },
  menuArrow: {
    fontSize: 24,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_MEDIUM,
    backgroundColor: COLORS.WHITE,
  },
  logoutButton: {
    backgroundColor: COLORS.ERROR,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});

