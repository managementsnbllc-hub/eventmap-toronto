import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '../constants/theme';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    // In production: send to Sentry / crash reporting
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="warning-outline" size={56} color={COLORS.warning} />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            {this.props.message || 'An unexpected error occurred. Please try again.'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={this.handleRetry}>
            <Ionicons name="refresh" size={18} color={COLORS.textInverse} />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
          {__DEV__ && this.state.error && (
            <Text style={styles.devError} numberOfLines={4}>
              {this.state.error.toString()}
            </Text>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xxxl,
    gap: SPACING.md,
  },
  title: {
    fontSize: FONT.sizes.xl,
    color: COLORS.textPrimary,
    ...FONT.semibold,
    marginTop: SPACING.md,
  },
  subtitle: {
    fontSize: FONT.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    marginTop: SPACING.lg,
  },
  retryText: {
    color: COLORS.textInverse,
    fontSize: FONT.sizes.md,
    ...FONT.semibold,
  },
  devError: {
    fontSize: FONT.sizes.xs,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.xl,
    fontFamily: 'monospace',
  },
});
