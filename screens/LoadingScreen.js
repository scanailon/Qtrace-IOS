import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/colors';
import LocationIcon from '../components/LocationIcon';

export default function LoadingScreen({ onComplete }) {
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      // Ícono de ubicación (escala + fade)
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
      // Logo (fade + slide up)
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1000),
    ]).start();

    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3200);

    return () => clearTimeout(timer);
  }, [onComplete, iconScale, iconOpacity, logoOpacity, logoTranslateY]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Animated.View
        style={[styles.iconContainer, { opacity: iconOpacity, transform: [{ scale: iconScale }] }]}
      >
        <LocationIcon size={100} color={COLORS.WHITE} />
      </Animated.View>

      <Animated.View
        style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ translateY: logoTranslateY }] }]}
      >
        <Image
          source={require('../assets/qtrace_start.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
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
  logoContainer: {
    marginTop: 8,
  },
  logoImage: {
    width: 200,
    height: 70,
  },
});
