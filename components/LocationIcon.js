import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function LocationIcon({ size = 80, color = COLORS.WHITE }) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Pin de ubicación (parte inferior) - estilo outline */}
      <View style={[styles.pin, { borderColor: color }]}>
        <View style={[styles.pinInner, { borderColor: color }]} />
      </View>
      
      {/* Líneas de conexión */}
      <View style={[styles.line1, { backgroundColor: color }]} />
      <View style={[styles.line2, { backgroundColor: color }]} />
      
      {/* Círculos superiores */}
      <View style={[styles.circle1, { backgroundColor: color }]} />
      <View style={[styles.circle2, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    position: 'absolute',
    bottom: 0,
    width: 28,
    height: 28,
    borderWidth: 2.5,
    borderRadius: 14,
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInner: {
    width: 12,
    height: 12,
    borderWidth: 2.5,
    borderRadius: 6,
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    transform: [{ rotate: '0deg' }],
  },
  line1: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    width: 2,
    height: 24,
    transform: [{ translateX: -1 }, { rotate: '-25deg' }],
  },
  line2: {
    position: 'absolute',
    bottom: 20,
    right: '50%',
    width: 2,
    height: 24,
    transform: [{ translateX: 1 }, { rotate: '25deg' }],
  },
  circle1: {
    position: 'absolute',
    top: 6,
    right: '28%',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  circle2: {
    position: 'absolute',
    top: 6,
    left: '28%',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});

