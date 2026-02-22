import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '../constants/theme';

const FREQUENCY_OPTIONS = [
  { key: 'DAILY',   label: 'Daily',   icon: 'today-outline' },
  { key: 'WEEKLY',  label: 'Weekly',  icon: 'calendar-outline' },
  { key: 'BIWEEKLY', label: 'Every 2 weeks', icon: 'calendar-outline' },
  { key: 'MONTHLY', label: 'Monthly', icon: 'calendar-number-outline' },
];

const DAY_OPTIONS = [
  { key: 'MO', label: 'M' },
  { key: 'TU', label: 'T' },
  { key: 'WE', label: 'W' },
  { key: 'TH', label: 'T' },
  { key: 'FR', label: 'F' },
  { key: 'SA', label: 'S' },
  { key: 'SU', label: 'S' },
];

// Default end date: 90 days from now
function getDefault90Days() {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d;
}

export default function RecurrencePicker({ value, onChange }) {
  // value shape: { enabled, frequency, days, endDate }
  const {
    enabled = false,
    frequency = 'WEEKLY',
    days = [],
    endDate = getDefault90Days(),
  } = value || {};

  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const update = useCallback((partial) => {
    onChange?.({ enabled, frequency, days, endDate, ...partial });
  }, [enabled, frequency, days, endDate, onChange]);

  const toggleDay = useCallback((dayKey) => {
    const next = days.includes(dayKey)
      ? days.filter((d) => d !== dayKey)
      : [...days, dayKey];
    update({ days: next });
  }, [days, update]);

  const maxEndDate = new Date();
  maxEndDate.setDate(maxEndDate.getDate() + 90);

  return (
    <View style={styles.container}>
      {/* Toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleLeft}>
          <Ionicons name="repeat" size={20} color={enabled ? COLORS.primary : COLORS.textTertiary} />
          <Text style={styles.toggleLabel}>Recurring event</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={(val) => update({ enabled: val })}
          trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
          thumbColor={enabled ? COLORS.primary : '#F4F4F4'}
        />
      </View>

      {enabled && (
        <View style={styles.optionsContainer}>
          {/* Frequency */}
          <Text style={styles.optionLabel}>Repeats</Text>
          <View style={styles.freqRow}>
            {FREQUENCY_OPTIONS.map((opt) => {
              const active = frequency === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.freqChip, active && styles.freqChipActive]}
                  onPress={() => update({ frequency: opt.key })}
                >
                  <Text style={[styles.freqChipText, active && styles.freqChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Day selector (for weekly / biweekly) */}
          {(frequency === 'WEEKLY' || frequency === 'BIWEEKLY') && (
            <>
              <Text style={styles.optionLabel}>On days</Text>
              <View style={styles.dayRow}>
                {DAY_OPTIONS.map((d) => {
                  const active = days.includes(d.key);
                  return (
                    <TouchableOpacity
                      key={d.key}
                      style={[styles.dayCircle, active && styles.dayCircleActive]}
                      onPress={() => toggleDay(d.key)}
                    >
                      <Text style={[styles.dayText, active && styles.dayTextActive]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* End date */}
          <Text style={styles.optionLabel}>Ends on</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndDatePicker(!showEndDatePicker)}
          >
            <Ionicons name="calendar" size={18} color={COLORS.primary} />
            <Text style={styles.dateButtonText}>
              {endDate.toLocaleDateString('en-CA', {
                weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
              })}
            </Text>
            <Ionicons
              name={showEndDatePicker ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={COLORS.textTertiary}
            />
          </TouchableOpacity>

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={new Date()}
              maximumDate={maxEndDate}
              onChange={(_, selectedDate) => {
                if (Platform.OS === 'android') setShowEndDatePicker(false);
                if (selectedDate) update({ endDate: selectedDate });
              }}
              style={styles.datePicker}
            />
          )}

          <View style={styles.hintRow}>
            <Ionicons name="information-circle-outline" size={14} color={COLORS.textTertiary} />
            <Text style={styles.hintText}>
              Maximum end date is 90 days from today. End date is required for all recurring events.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  toggleLabel: {
    fontSize: FONT.sizes.md,
    color: COLORS.textPrimary,
    ...FONT.medium,
  },
  optionsContainer: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  optionLabel: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.medium,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  freqRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  freqChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  freqChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  freqChipText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.medium,
  },
  freqChipTextActive: {
    color: COLORS.textInverse,
  },
  dayRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.semibold,
  },
  dayTextActive: {
    color: COLORS.textInverse,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateButtonText: {
    flex: 1,
    fontSize: FONT.sizes.md,
    color: COLORS.textPrimary,
    ...FONT.medium,
  },
  datePicker: {
    marginTop: SPACING.sm,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  hintText: {
    flex: 1,
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    lineHeight: 17,
  },
});
