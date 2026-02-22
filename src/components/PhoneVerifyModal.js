import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Modal,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '../constants/theme';
import { useAuth } from '../state/AuthContext';

export default function PhoneVerifyModal({ visible, onClose, onVerified }) {
  const { verificationStep, startVerification, submitCode, resetVerification } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const codeInputRef = useRef(null);

  const handleSendCode = useCallback(async () => {
    // Basic Canadian phone validation
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number.');
      return;
    }
    setLoading(true);
    const { error } = await startVerification('+1' + cleaned.slice(-10));
    setLoading(false);
    if (error) {
      Alert.alert('Error', error);
    }
  }, [phone, startVerification]);

  const handleVerifyCode = useCallback(async () => {
    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    const success = await submitCode(code);
    setLoading(false);
    if (success) {
      onVerified?.();
    } else {
      Alert.alert('Invalid Code', 'The code you entered is incorrect. Try again.');
    }
  }, [code, submitCode, onVerified]);

  const handleClose = useCallback(() => {
    resetVerification();
    setPhone('');
    setCode('');
    onClose?.();
  }, [resetVerification, onClose]);

  const isCodeStep = verificationStep === 'entering_code';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={26} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconCircle}>
              <Ionicons
                name={isCodeStep ? 'chatbubble-ellipses' : 'phone-portrait'}
                size={36}
                color={COLORS.primary}
              />
            </View>

            {!isCodeStep ? (
              <>
                {/* ── Phone entry step ── */}
                <Text style={styles.title}>Verify your phone</Text>
                <Text style={styles.subtitle}>
                  Phone verification is required to post events. This keeps our community safe and spam-free.
                </Text>

                <View style={styles.inputContainer}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+1</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="(416) 555-0123"
                    placeholderTextColor={COLORS.textTertiary}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoFocus
                    maxLength={14}
                  />
                </View>

                <Text style={styles.disclaimer}>
                  We'll send a 6-digit code via SMS. Standard messaging rates may apply. Your number is never shared.
                </Text>

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                  onPress={handleSendCode}
                  disabled={loading}
                >
                  <Text style={styles.primaryBtnText}>
                    {loading ? 'Sending...' : 'Send verification code'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* ── Code entry step ── */}
                <Text style={styles.title}>Enter verification code</Text>
                <Text style={styles.subtitle}>
                  We sent a 6-digit code to your phone. Enter it below.
                </Text>

                <Text style={styles.stubNote}>
                  Demo mode: enter any 6 digits to verify
                </Text>

                <TextInput
                  ref={codeInputRef}
                  style={styles.codeInput}
                  placeholder="000000"
                  placeholderTextColor={COLORS.textTertiary}
                  value={code}
                  onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  textAlign="center"
                />

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                  onPress={handleVerifyCode}
                  disabled={loading}
                >
                  <Text style={styles.primaryBtnText}>
                    {loading ? 'Verifying...' : 'Verify'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
                    resetVerification();
                    setCode('');
                  }}
                >
                  <Text style={styles.secondaryBtnText}>Use a different number</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xxxl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT.sizes.xxl,
    color: COLORS.textPrimary,
    ...FONT.bold,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: FONT.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },
  stubNote: {
    fontSize: FONT.sizes.sm,
    color: COLORS.primary,
    ...FONT.medium,
    textAlign: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    alignSelf: 'stretch',
  },
  countryCode: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderBottomLeftRadius: RADIUS.lg,
  },
  countryCodeText: {
    fontSize: FONT.sizes.lg,
    color: COLORS.textPrimary,
    ...FONT.semibold,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    fontSize: FONT.sizes.lg,
    color: COLORS.textPrimary,
  },
  codeInput: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    fontSize: 28,
    color: COLORS.textPrimary,
    ...FONT.bold,
    letterSpacing: 12,
    marginBottom: SPACING.xxl,
  },
  disclaimer: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.xxl,
  },
  primaryBtn: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: COLORS.textInverse,
    fontSize: FONT.sizes.lg,
    ...FONT.semibold,
  },
  secondaryBtn: {
    padding: SPACING.md,
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontSize: FONT.sizes.md,
    ...FONT.medium,
  },
});
