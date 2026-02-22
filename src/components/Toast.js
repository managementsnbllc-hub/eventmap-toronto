import React, { useState, useCallback, useRef, useEffect, createContext, useContext } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT, SHADOWS } from '../constants/theme';

const ToastContext = createContext(null);

const TOAST_ICONS = {
  success: { name: 'checkmark-circle', color: COLORS.success },
  error: { name: 'alert-circle', color: COLORS.error },
  info: { name: 'information-circle', color: COLORS.primary },
  warning: { name: 'warning', color: COLORS.warning },
};

function ToastBar() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const timerRef = useRef(null);

  const show = useCallback(({ message, type = 'info', duration = 3000 }) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start(() => setToast(null));
    }, duration);
  }, [opacity, translateY]);

  // Expose show method via ref
  ToastBar._show = show;

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  if (!toast) return null;

  const icon = TOAST_ICONS[toast.type] || TOAST_ICONS.info;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { bottom: insets.bottom + 80, opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <View style={styles.toastInner}>
        <Ionicons name={icon.name} size={20} color={icon.color} />
        <Text style={styles.toastText} numberOfLines={2}>{toast.message}</Text>
      </View>
    </Animated.View>
  );
}

export function ToastProvider({ children }) {
  return (
    <>
      {children}
      <ToastBar />
    </>
  );
}

// Global show function
export function showToast(message, type = 'info', duration = 3000) {
  if (ToastBar._show) {
    ToastBar._show({ message, type, duration });
  }
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: SPACING.xl,
    right: SPACING.xl,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.textPrimary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.lg,
    ...SHADOWS.lg,
    maxWidth: 400,
  },
  toastText: {
    flex: 1,
    fontSize: FONT.sizes.sm,
    color: COLORS.textInverse,
    ...FONT.medium,
    lineHeight: 19,
  },
});
