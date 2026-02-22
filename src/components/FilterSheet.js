import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal,
  SafeAreaView, Platform, Alert, TextInput, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS, SPACING, RADIUS, FONT, SHADOWS, CATEGORY_CONFIG,
} from '../constants/theme';
import {
  DEFAULT_FILTERS, SORT_OPTIONS, DISTANCE_OPTIONS, getActiveFilterCount,
} from '../utils/filterEngine';
import { useSavedFilters } from '../state/SavedFiltersContext';

const EVENT_MODE_OPTIONS = [
  { key: 'all',       label: 'All events',  icon: 'grid-outline' },
  { key: 'in_person', label: 'In-person',   icon: 'location-outline' },
  { key: 'online',    label: 'Online',       icon: 'videocam-outline' },
];

const PRICE_OPTIONS = [
  { key: 'all',  label: 'Any price' },
  { key: 'free', label: 'Free only' },
  { key: 'paid', label: 'Paid only' },
];

const CATEGORIES = Object.entries(CATEGORY_CONFIG).map(([key, val]) => ({
  key,
  ...val,
}));

export default function FilterSheet({ visible, filters, onApply, onClose }) {
  // Local draft of filters (only applied on "Show results")
  const [draft, setDraft] = useState({ ...filters });
  const { savePreset } = useSavedFilters();
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');

  // Reset draft when sheet opens
  React.useEffect(() => {
    if (visible) setDraft({ ...filters });
  }, [visible, filters]);

  const activeCount = useMemo(() => getActiveFilterCount(draft), [draft]);

  // ── Update helpers ──
  const set = useCallback((key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleCategory = useCallback((catKey) => {
    setDraft((prev) => {
      const cats = prev.categories.includes(catKey)
        ? prev.categories.filter((c) => c !== catKey)
        : [...prev.categories, catKey];
      return { ...prev, categories: cats };
    });
  }, []);

  const handleReset = useCallback(() => {
    setDraft({ ...DEFAULT_FILTERS, timeRange: filters.timeRange, searchQuery: filters.searchQuery });
  }, [filters.timeRange, filters.searchQuery]);

  const handleApply = useCallback(() => {
    onApply(draft);
  }, [draft, onApply]);

  const handleSaveFilter = useCallback(() => {
    if (activeCount === 0) {
      Alert.alert('No filters set', 'Apply at least one filter before saving.');
      return;
    }
    setSaveFilterName('');
    setShowSavePrompt(true);
  }, [activeCount]);

  const handleConfirmSave = useCallback(() => {
    if (saveFilterName.trim()) {
      savePreset(saveFilterName.trim(), draft);
      setShowSavePrompt(false);
      Alert.alert('Saved!', `"${saveFilterName.trim()}" has been saved to your filters.`);
    }
  }, [saveFilterName, draft, savePreset]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={26} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filters & Sort</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Sort By ── */}
          <Text style={styles.sectionTitle}>Sort by</Text>
          <View style={styles.optionGrid}>
            {SORT_OPTIONS.map((opt) => {
              const active = draft.sortBy === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.sortChip, active && styles.sortChipActive]}
                  onPress={() => set('sortBy', opt.key)}
                >
                  <Ionicons
                    name={opt.icon}
                    size={16}
                    color={active ? COLORS.textInverse : COLORS.textSecondary}
                  />
                  <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Event Type ── */}
          <Text style={styles.sectionTitle}>Event type</Text>
          <View style={styles.segmentRow}>
            {EVENT_MODE_OPTIONS.map((opt) => {
              const active = draft.eventMode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() => set('eventMode', opt.key)}
                >
                  <Ionicons
                    name={opt.icon}
                    size={16}
                    color={active ? COLORS.textInverse : COLORS.textSecondary}
                  />
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Categories ── */}
          <Text style={styles.sectionTitle}>Categories</Text>
          <Text style={styles.sectionHint}>Select one or more, or leave empty for all</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const active = draft.categories.includes(cat.key);
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryChip,
                    active && { backgroundColor: cat.color + '20', borderColor: cat.color },
                  ]}
                  onPress={() => toggleCategory(cat.key)}
                >
                  <Ionicons
                    name={cat.icon}
                    size={15}
                    color={active ? cat.color : COLORS.textTertiary}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      active && { color: cat.color },
                    ]}
                  >
                    {cat.label}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark-circle" size={14} color={cat.color} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Price ── */}
          <Text style={styles.sectionTitle}>Price</Text>
          <View style={styles.segmentRow}>
            {PRICE_OPTIONS.map((opt) => {
              const active = draft.priceType === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() => set('priceType', opt.key)}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Distance ── */}
          <Text style={styles.sectionTitle}>Maximum distance</Text>
          <View style={styles.optionGrid}>
            {DISTANCE_OPTIONS.map((opt) => {
              const active = draft.maxDistance === opt.key;
              return (
                <TouchableOpacity
                  key={String(opt.key)}
                  style={[styles.distChip, active && styles.distChipActive]}
                  onPress={() => set('maxDistance', opt.key)}
                >
                  <Text style={[styles.distChipText, active && styles.distChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          {showSavePrompt ? (
            <View style={styles.savePrompt}>
              <Text style={styles.savePromptLabel}>Name this filter:</Text>
              <TextInput
                style={styles.savePromptInput}
                placeholder="e.g. Free music nearby"
                placeholderTextColor={COLORS.textTertiary}
                value={saveFilterName}
                onChangeText={setSaveFilterName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleConfirmSave}
              />
              <View style={styles.savePromptBtns}>
                <TouchableOpacity onPress={() => setShowSavePrompt(false)} style={styles.savePromptCancel}>
                  <Text style={styles.savePromptCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmSave}
                  style={[styles.savePromptConfirm, !saveFilterName.trim() && { opacity: 0.4 }]}
                  disabled={!saveFilterName.trim()}
                >
                  <Text style={styles.savePromptConfirmText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {activeCount > 0 && (
                <TouchableOpacity style={styles.saveFilterBtn} onPress={handleSaveFilter}>
                  <Ionicons name="bookmark-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.saveFilterText}>Save filter</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                <Text style={styles.applyBtnText}>Show results</Text>
                {activeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{activeCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
  },

  // Section
  sectionTitle: {
    fontSize: FONT.sizes.md,
    color: COLORS.textPrimary,
    ...FONT.semibold,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  sectionHint: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    marginBottom: SPACING.md,
    marginTop: -4,
  },

  // Sort chips
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortChipText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.medium,
  },
  sortChipTextActive: {
    color: COLORS.textInverse,
  },

  // Segment control
  segmentRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  segmentText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.medium,
  },
  segmentTextActive: {
    color: COLORS.textInverse,
  },

  // Category chips
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 1,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  categoryChipText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.medium,
  },

  // Distance chips
  distChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  distChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  distChipText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.medium,
  },
  distChipTextActive: {
    color: COLORS.textInverse,
  },

  // Footer
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.background,
  },
  saveFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  saveFilterText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.primary,
    ...FONT.medium,
  },
  savePrompt: {
    gap: SPACING.md,
  },
  savePromptLabel: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.medium,
  },
  savePromptInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT.sizes.md,
    color: COLORS.textPrimary,
  },
  savePromptBtns: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  savePromptCancel: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  savePromptCancelText: {
    fontSize: FONT.sizes.md,
    color: COLORS.textSecondary,
    ...FONT.medium,
  },
  savePromptConfirm: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  savePromptConfirmText: {
    fontSize: FONT.sizes.md,
    color: COLORS.textInverse,
    ...FONT.semibold,
  },
  applyBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  applyBtnText: {
    color: COLORS.textInverse,
    fontSize: FONT.sizes.lg,
    ...FONT.semibold,
  },
  badge: {
    backgroundColor: COLORS.textInverse,
    borderRadius: RADIUS.full,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: FONT.sizes.xs,
    ...FONT.bold,
  },
});
