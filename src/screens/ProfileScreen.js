import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT, RADIUS } from '../constants/theme';
import { useAuth } from '../state/AuthContext';
import PhoneVerifyModal from '../components/PhoneVerifyModal';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, isVerified, signOut } = useAuth();
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const handleVerify = useCallback(() => {
    setShowVerifyModal(true);
  }, []);

  const handleVerified = useCallback(() => {
    setShowVerifyModal(false);
  }, []);

  const handleCreateEvent = useCallback(() => {
    navigation.navigate('CreateEvent');
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Profile</Text>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User card */}
        {isVerified ? (
          <View style={styles.userCard}>
            <View style={styles.avatarVerified}>
              <Ionicons name="person" size={28} color={COLORS.primary} />
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.display_name || 'EventMap User'}</Text>
              <Text style={styles.userPhone}>{user?.phone || 'Verified'}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.signInCard}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={32} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.signInTitle}>Sign in to post events</Text>
            <Text style={styles.signInSubtitle}>
              Phone verification required to publish events. Browse freely without an account.
            </Text>
            <TouchableOpacity style={styles.signInButton} onPress={handleVerify}>
              <Text style={styles.signInButtonText}>Verify Phone Number</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Create event CTA */}
        {isVerified && (
          <TouchableOpacity style={styles.createCta} onPress={handleCreateEvent}>
            <Ionicons name="add-circle" size={22} color={COLORS.textInverse} />
            <Text style={styles.createCtaText}>Create an Event</Text>
          </TouchableOpacity>
        )}

        {/* Menu items */}
        <View style={styles.menuSection}>
          {[
            { icon: 'calendar-outline', label: 'My Events', action: 'myEvents', note: !isVerified ? 'Requires verification' : null },
            { icon: 'person-outline', label: 'Edit Profile', action: 'editProfile', note: !isVerified ? 'Requires verification' : null },
            { icon: 'notifications-outline', label: 'Notification Settings', action: 'notifPrefs' },
            { icon: 'star-outline', label: 'My Ratings' },
            { icon: 'flag-outline', label: 'My Reports' },
            { icon: 'help-circle-outline', label: 'Help & Feedback' },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.menuItem}
              onPress={() => {
                if (item.action === 'notifPrefs') navigation.navigate('NotifPrefs');
                else if (item.action === 'myEvents' && isVerified) navigation.navigate('MyEvents');
                else if (item.action === 'editProfile' && isVerified) navigation.navigate('EditProfile');
              }}
            >
              <Ionicons name={item.icon} size={22} color={COLORS.textSecondary} />
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
                {item.note && (
                  <Text style={styles.menuItemNote}>{item.note}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        {isVerified && (
          <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      <PhoneVerifyModal
        visible={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onVerified={handleVerified}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    fontSize: FONT.sizes.title,
    color: COLORS.textPrimary,
    ...FONT.bold,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },

  // Verified user card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.lg,
  },
  avatarVerified: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.background,
    borderRadius: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FONT.sizes.lg,
    color: COLORS.textPrimary,
    ...FONT.semibold,
  },
  userPhone: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textTertiary,
    marginTop: 2,
  },

  // Sign in card (unverified)
  signInCard: {
    alignItems: 'center',
    padding: SPACING.xxl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xxl,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  signInTitle: {
    fontSize: FONT.sizes.lg,
    color: COLORS.textPrimary,
    ...FONT.semibold,
    marginBottom: SPACING.sm,
  },
  signInSubtitle: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  signInButtonText: {
    color: COLORS.textInverse,
    fontSize: FONT.sizes.md,
    ...FONT.semibold,
  },

  // Create CTA
  createCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xxl,
  },
  createCtaText: {
    color: COLORS.textInverse,
    fontSize: FONT.sizes.md,
    ...FONT.semibold,
  },

  // Menu
  menuSection: {
    gap: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SPACING.lg,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: FONT.sizes.md,
    color: COLORS.textPrimary,
    ...FONT.medium,
  },
  menuItemNote: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xxl,
    paddingVertical: SPACING.lg,
  },
  signOutText: {
    fontSize: FONT.sizes.md,
    color: COLORS.error,
    ...FONT.medium,
  },
});
