import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

export default function CustomDateTimePicker({ label, value, onChange, placeholder }) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || new Date());
  const [mode, setMode] = useState('date');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
    }
  }, [value]);

  const formatDate = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (date) => {
    if (!date) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    return `${formatDate(date)} ${formatTime(date)}`;
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && date) {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(date.getFullYear());
        newDate.setMonth(date.getMonth());
        newDate.setDate(date.getDate());
        setSelectedDate(newDate);
        setShowDatePicker(false);
        // Mostrar selector de hora después de seleccionar fecha
        setTimeout(() => {
          setShowTimePicker(true);
          setMode('time');
        }, 300);
      } else {
        setShowDatePicker(false);
      }
    } else {
      // iOS
      if (date) {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(date.getFullYear());
        newDate.setMonth(date.getMonth());
        newDate.setDate(date.getDate());
        setSelectedDate(newDate);
        if (mode === 'date') {
          setMode('time');
          setShowTimePicker(true);
        } else {
          setShowTimePicker(false);
          setShowDatePicker(false);
          if (onChange) {
            onChange(newDate);
          }
        }
      }
    }
  };

  const handleTimeChange = (event, date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && date) {
        const newDate = new Date(selectedDate);
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
        setSelectedDate(newDate);
        setShowTimePicker(false);
        if (onChange) {
          onChange(newDate);
        }
      } else {
        setShowTimePicker(false);
      }
    } else {
      // iOS - ya manejado en handleDateChange
      if (date && onChange) {
        onChange(date);
      }
    }
  };

  const handlePress = () => {
    setIsFocused(true);
    setMode('date');
    setShowDatePicker(true);
  };

  const handleCancel = () => {
    setIsFocused(false);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setMode('date');
  };

  const handleDone = () => {
    setIsFocused(false);
    setShowTimePicker(false);
    setShowDatePicker(false);
    setMode('date');
    if (onChange) {
      onChange(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {label && (
          <Text style={styles.floatingLabel}>
            {label}
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.input,
            isFocused && styles.inputFocused
          ]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.inputText,
            !value && styles.placeholder
          ]}>
            {value ? formatDateTime(value) : placeholder || 'Seleccionar fecha y hora'}
          </Text>
          <Feather name="calendar" size={20} color={value ? COLORS.PRIMARY : COLORS.GRAY_DARK} />
        </TouchableOpacity>
      </View>

      {Platform.OS === 'ios' && (showDatePicker || showTimePicker) && (
        <View style={styles.iosPickerContainer}>
          <View style={styles.iosPickerHeader}>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.iosPickerButton}
            >
              <Text style={styles.iosPickerButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.iosPickerTitle}>
              {mode === 'date' ? 'Seleccionar Fecha' : 'Seleccionar Hora'}
            </Text>
            {mode === 'time' ? (
              <TouchableOpacity
                onPress={handleDone}
                style={styles.iosPickerButton}
              >
                <Text style={[styles.iosPickerButtonText, styles.iosPickerButtonTextPrimary]}>
                  Listo
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.iosPickerButton} />
            )}
          </View>
          <DateTimePicker
            value={selectedDate}
            mode={mode}
            display="spinner"
            onChange={mode === 'date' ? handleDateChange : handleTimeChange}
            locale="es-ES"
          />
        </View>
      )}

      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY_MEDIUM,
    minHeight: 56,
  },
  inputFocused: {
    borderColor: COLORS.PRIMARY,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.BLACK,
    fontWeight: '400',
  },
  placeholder: {
    color: COLORS.GRAY_DARK,
    fontWeight: '400',
  },
  iosPickerContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_MEDIUM,
  },
  iosPickerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  iosPickerButtonText: {
    fontSize: 16,
    color: COLORS.GRAY_DARK,
    fontWeight: '500',
  },
  iosPickerButtonTextPrimary: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  iosPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.BLACK,
  },
});

