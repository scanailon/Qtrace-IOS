import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/colors';
import LocationIcon from '../components/LocationIcon';

export default function LoadingScreen({ onComplete }) {
  // Animaciones
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const unkOpacity = useRef(new Animated.Value(0)).current;
  const unkTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Secuencia de animaciones
    Animated.sequence([
      // Animación del ícono (aparece con escala y fade)
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Animación del título "Q Trace"
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Animación de "UNK"
      Animated.parallel([
        Animated.timing(unkOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(unkTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Esperar un momento antes de redirigir
      Animated.delay(1000),
    ]).start();

    // Redirigir después de todas las animaciones (aproximadamente 3 segundos)
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 3200);

    return () => clearTimeout(timer);
  }, [onComplete, iconScale, iconOpacity, titleOpacity, titleTranslateY, unkOpacity, unkTranslateY]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Ícono animado */}
      <Animated.View
        style={[
          styles.iconContainer,
          {
            opacity: iconOpacity,
            transform: [{ scale: iconScale }],
          },
        ]}
      >
        <LocationIcon size={100} color={COLORS.WHITE} />
      </Animated.View>

      {/* Título "Q Trace" animado */}
      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          },
        ]}
      >
        <Text style={styles.title}>Q Trace</Text>
      </Animated.View>

      {/* "UNK" animado */}
      <Animated.View
        style={[
          styles.unkContainer,
          {
            opacity: unkOpacity,
            transform: [{ translateY: unkTranslateY }],
          },
        ]}
      >
        <Text style={styles.unk}>UNK</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 40,
  },
  titleContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    letterSpacing: 2,
  },
  unkContainer: {
    marginTop: 10,
  },
  unk: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    letterSpacing: 4,
  },
});

