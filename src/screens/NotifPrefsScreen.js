import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT, CATEGORY_CONFIG } from '../constants/theme';
import { useNotifPrefs } from '../state/NotifPrefsContext';
import { requestPushPermission } from '../services/pushService';

const CATEGORIES = Object.entries(CATEGORY_CONFIG).map(([key, val]) => ({ key, ...val }));

const RADIUS_OPTIONS = [
  { key: 1,  label: '1 km' },
  { key: 2,  label: '2 km' },
  { key: 5,  label: '5 km' },
  { key: 10, label: '10 km' },
  { key: 25, label: '25 km' },
];

const REMINDER_OPTIONS = [
  { key: 15,  label: '15 min' },
  { key: 30,  label: '30 min' },
  { key: 60,  label: '1 hour' },
  { key: 120, label: '2 hours' },
  { key: 1440, label: '1 day' },
];

export default function NotifPrefsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { prefs, updatePrefs, toggleCategory, resetPrefs } = useNotifPrefs();
  const [permissionRequested, setPermissionRequested] = useState(false);

  const handleTogglePush = useCallback(async (enabled) => {
    if (enabled && !permissionRequested) {
      const { granted } = await requestPushPermission();
      setPermissionRequested(true);
      if (!granted) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive alerts.'
        );
        return;
      }
    }
    updatePrefs({ pushEnabled: enabled });
  }, [permissionRequested, updatePrefs]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset Preferences',
      'Reset all notification settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetPrefs },
      ]
    );
  }, [resetPrefs]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Master toggle ── */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.primary + '15' }]}>
                <Ionicons name="notifications" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.toggleText}>
                <Text style={styles.toggleLabel}>Push Notifications</Text>
                <Text style={styles.toggleHint}>
                  {prefs.pushEnabled ? 'Receiving alerts' : 'All notifications off'}
                </Text>
              </View>
            </View>
            <Switch
              value={prefs.pushEnabled}
              onValueChange={handleTogglePush}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
              thumbColor={prefs.pushEnabled ? COLORS.primary : '#F4F4F4'}
            />
          </View>
        </View>

        {prefs.pushEnabled && (
          <>
            {/* ── Saved event reminders ── */}
            <Text style={styles.sectionTitle}>Event Reminders</Text>
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Ionicons name="alarm-outline" size={20} color={COLORS.textSecondary} />
                  <View style={styles.toggleText}>
                    <Text style={styles.toggleLabel}>Saved event reminders</Text>
                    <Text style={styles.toggleHint}>
                      Get reminded before events you've saved
                    </Text>
                  </View>
                </View>
                <Switch
                  value={prefs.savedEventReminders}
                  onValueChange={(v) => updatePrefs({ savedEventReminders: v })}
                  trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
                  thumbColor={prefs.savedEventReminders ? COLORS.primary : '#F4F4F4'}
                />
              </View>

              {prefs.savedEventReminders && (
                <View style={styles.subSection}>
                  <Text style={styles.subLabel}>Remind me</Text>
                  <View style={styles.chipRow}>
                    {REMINDER_OPTIONS.map((opt) => {
                      const active = prefs.reminderMinutesBefore === opt.key;
                      return (
                        <TouchableOpacity
                          key={opt.key}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() => updatePrefs({ reminderMinutesBefore: opt.key })}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={styles.chipHint}>before event starts</Text>
                </View>
              )}
            </View>

            {/* ── New events nearby ── */}
            <Text style={styles.sectionTitle}>Discovery Alerts</Text>
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Ionicons name="locate-outline" size={20} color={COLORS.textSecondary} />
                  <View style={styles.toggleText}>
                    <Text style={styles.toggleLabel}>New events nearby</Text>
                    <Text style={styles.toggleHint}>
                      Alert when new events are posted in your area
                    </Text>
                  </View>
                </View>
                <Switch
                  value={prefs.newEventsNearby}
                  onValueChange={(v) => updatePrefs({ newEventsNearby: v })}
                  trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
                  thumbColor={prefs.newEventsNearby ? COLORS.primary : '#F4F4F4'}
                />
              </View>

              {prefs.newEventsNearby && (
                <>
                  {/* Radius */}
                  <View style={styles.subSection}>
                    <Text style={styles.subLabel}>Within</Text>
                    <View style={styles.chipRow}>
                      {RADIUS_OPTIONS.map((opt) => {
                        const active = prefs.radiusKm === opt.key;
                        return (
                          <TouchableOpacity
                            key={opt.key}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => updatePrefs({ radiusKm: opt.key })}
                          >
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Categories */}
                  <View style={styles.subSection}>
                    <Text style={styles.subLabel}>Categories</Text>
                    <Text style={styles.chipHint}>
                      {prefs.categoryAlerts.length === 0
                        ? 'All categories (tap to narrow)'
                        : `${prefs.categoryAlerts.length} selected`}
                    </Text>
                    <View style={styles.categoryGrid}>
                      {CATEGORIES.map((cat) => {
                        const active = prefs.categoryAlerts.includes(cat.key);
                        return (
                          <TouchableOpacity
                            key={cat.key}
                            style={[
                              styles.catChip,
                              active && { backgroundColor: cat.color + '20', borderColor: cat.color },
                            ]}
                            onPress={() => toggleCategory(cat.key)}
                          >
                            <Ionicons
                              name={cat.icon}
                              size={14}
                              color={active ? cat.color : COLORS.textTertiary}
                            />
                            <Text style={[styles.catChipText, active && { color: cat.color }]}>
                              {cat.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* ── Quiet hours ── */}
            <Text style={styles.sectionTitle}>Quiet Hours</Text>
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Ionicons name="moon-outline" size={20} color={COLORS.textSecondary} />
                  <View style={styles.toggleText}>
                    <Text style={styles.toggleLabel}>Quiet hours</Text>
                    <Text style={styles.toggleHint}>
                      {prefs.quietHoursEnabled
                        ? `Silent ${prefs.quietStart} – ${prefs.quietEnd}`
                        : 'No notification restrictions'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={prefs.quietHoursEnabled}
                  onValueChange={(v) => updatePrefs({ quietHoursEnabled: v })}
                  trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
                  thumbColor={prefs.quietHoursEnabled ? COLORS.primary : '#F4F4F4'}
                />
              </View>
              {prefs.quietHoursEnabled && (
                <View style={styles.quietTimesRow}>
                  <View style={styles.quietTimeBlock}>
                    <Text style={styles.quietTimeLabel}>From</Text>
                    <Text style={styles.quietTimeValue}>{prefs.quietStart}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.textTertiary} />
                  <View style={styles.quietTimeBlock}>
                    <Text style={styles.quietTimeLabel}>Until</Text>
                    <Text style={styles.quietTimeValue}>{prefs.quietEnd}</Text>
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    fontSize: FONT.sizes.lg,
    color: COLORS.textPrimary,
    ...FONT.semibold,
  },
  resetText: {
    fontSize: FONT.sizes.md,
    color: COLORS.primary,
    ...FONT.medium,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
  },

  // Sections
  sectionTitle: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textTertiary,
    ...FONT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.xxl,
    marginBottom: SPACING.md,
  },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },

  // Toggle row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
    marginRight: SPACING.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: FONT.sizes.md,
    color: COLORS.textPrimary,
    ...FONT.medium,
  },
  toggleHint: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },

  // Sub sections within cards
  subSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  subLabel: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.medium,
    marginBottom: SPACING.sm,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.medium,
  },
  chipTextActive: {
    color: COLORS.textInverse,
  },
  chipHint: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    marginTop: 6,
  },

  // Category grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  catChipText: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textSecondary,
    ...FONT.medium,
  },

  // Quiet hours
  quietTimesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  quietTimeBlock: {
    alignItems: 'center',
    gap: 4,
  },
  quietTimeLabel: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    ...FONT.medium,
  },
  quietTimeValue: {
    fontSize: FONT.sizes.xl,
    color: COLORS.textPrimary,
    ...FONT.bold,
  },
});
