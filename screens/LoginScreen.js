import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { login } from '../services/authService';
import { COLORS } from '../constants/colors';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  const validateFields = () => {
    const errors = { email: '', password: '' };
    let isValid = true;

    if (!email.trim()) {
      errors.email = 'El correo electrónico es requerido';
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = 'Ingresa un correo electrónico válido';
        isValid = false;
      }
    }

    if (!password.trim()) {
      errors.password = 'La contraseña es requerida';
      isValid = false;
    } else if (password.length < 4) {
      errors.password = 'La contraseña debe tener al menos 4 caracteres';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleLogin = async () => {
    setError('');
    setFieldErrors({ email: '', password: '' });

    if (!validateFields()) return;

    setLoading(true);
    try {
      const { token, user } = await login(email.trim(), password);
      console.log('Login exitoso, token:', token);
      console.log('Usuario:', user);

      const userProfile = {
        token,
        email: user?.email || email.trim(),
        name: user?.name || '',
        userId: user?.userId || '',
        customerId: user?.customerId || '',
        customerName: user?.customerName || '',
        authority: user?.authority || '',
      };

      if (onLoginSuccess) {
        onLoginSuccess(userProfile);
      }
    } catch (err) {
      console.error('Error en login:', err);
      let errorMessage = 'Error al iniciar sesión. Por favor intenta nuevamente.';

      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Correo o contraseña incorrectos.';
          setFieldErrors({
            email: 'Credenciales incorrectas',
            password: 'Credenciales incorrectas',
          });
        } else if (err.response.status === 400) {
          errorMessage = 'Datos inválidos. Verifica la información ingresada.';
        } else if (err.response.status >= 500) {
          errorMessage = 'Error del servidor. Por favor intenta más tarde.';
        }
      } else if (err.request) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: '' });
    }
    if (error) setError('');

    if (field === 'email') setEmail(value);
    else if (field === 'password') setPassword(value);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />

      <View style={styles.header}>
        <Image
          source={require('../assets/qtrace.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.content}>
        <View style={styles.loginContainer}>
          <Text style={styles.title}>Iniciar sesión</Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, fieldErrors.email ? styles.inputError : null]}
              placeholder="Correo electrónico"
              placeholderTextColor={COLORS.GRAY_DARK}
              value={email}
              onChangeText={(v) => handleFieldChange('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            {fieldErrors.email ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, fieldErrors.password ? styles.inputError : null]}
              placeholder="Contraseña"
              placeholderTextColor={COLORS.GRAY_DARK}
              value={password}
              onChangeText={(v) => handleFieldChange('password', v)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            {fieldErrors.password ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.password}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.WHITE} />
            ) : (
              <Text style={styles.loginButtonText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={() => console.log('Recuperar contraseña')}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: 160,
    height: 50,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  loginContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    marginBottom: 40,
    textAlign: 'center',
  },
  errorContainer: {
    width: '100%',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.ERROR,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.BLACK,
    borderWidth: 1,
    borderColor: COLORS.GRAY_MEDIUM,
  },
  inputError: {
    borderColor: COLORS.ERROR,
    backgroundColor: '#FEE2E2',
  },
  fieldErrorText: {
    color: COLORS.ERROR,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPasswordContainer: {
    marginTop: 10,
  },
  forgotPasswordText: {
    color: COLORS.PRIMARY,
    fontSize: 16,
  },
});
