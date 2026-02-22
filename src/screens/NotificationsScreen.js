import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT, RADIUS, CATEGORY_CONFIG } from '../constants/theme';
import { useNotifPrefs } from '../state/NotifPrefsContext';
import { useSavedFilters } from '../state/SavedFiltersContext';
import { getFilterSummary } from '../utils/filterEngine';

// ── Mock notification data (replaced by real push events later) ──
const MOCK_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'new_event',
    title: 'New event nearby',
    body: 'Saturday Farmers Market was just posted at Evergreen Brick Works',
    category: 'food',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    read: false,
  },
  {
    id: 'n2',
    type: 'reminder',
    title: 'Starting in 1 hour',
    body: 'Jazz Night at The Rex — 194 Queen St W',
    category: 'music',
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
    read: true,
  },
  {
    id: 'n3',
    type: 'new_event',
    title: 'New tech event',
    body: 'AI & Startups Meetup was just posted — online event',
    category: 'tech',
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    read: true,
  },
];

function timeAgo(isoString) {
  const mins = Math.floor((Date.now() - new Date(isoString)) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { prefs } = useNotifPrefs();
  const { presets, deletePreset } = useSavedFilters();
  const [activeTab, setActiveTab] = useState('alerts');

  const handleOpenPrefs = useCallback(() => {
    navigation.navigate('NotifPrefs');
  }, [navigation]);

  const handleDeletePreset = useCallback((preset) => {
    Alert.alert(
      'Delete Filter',
      `Remove "${preset.name}" from saved filters?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deletePreset(preset.id) },
      ]
    );
  }, [deletePreset]);

  const handleApplyPreset = useCallback((preset) => {
    // Navigate to Explore tab with these filters applied
    navigation.navigate('Explore', { applyFilters: preset.filters });
  }, [navigation]);

  // ── Notification item ──
  const renderNotification = useCallback(({ item }) => {
    const cat = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;
    const iconMap = { reminder: 'alarm', new_event: 'add-circle', update: 'refresh-circle' };
    return (
      <View style={[styles.notifItem, !item.read && styles.notifItemUnread]}>
        <View style={[styles.notifIcon, { backgroundColor: cat.color + '15' }]}>
          <Ionicons name={iconMap[item.type] || 'notifications'} size={20} color={cat.color} />
        </View>
        <View style={styles.notifContent}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.notifTime}>{timeAgo(item.timestamp)}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </View>
    );
  }, []);

  // ── Saved filter item ──
  const renderPreset = useCallback(({ item }) => {
    const summary = getFilterSummary(item.filters) || 'Default filters';
    return (
      <TouchableOpacity style={styles.presetItem} onPress={() => handleApplyPreset(item)}>
        <View style={styles.presetLeft}>
          <Ionicons name={item.icon || 'bookmark'} size={20} color={COLORS.primary} />
          <View style={styles.presetText}>
            <Text style={styles.presetName}>{item.name}</Text>
            <Text style={styles.presetSummary} numberOfLines={1}>{summary}</Text>
          </View>
        </View>
        <View style={styles.presetActions}>
          <TouchableOpacity
            onPress={() => handleApplyPreset(item)}
            style={styles.presetApplyBtn}
          >
            <Text style={styles.presetApplyText}>Apply</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeletePreset(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [handleApplyPreset, handleDeletePreset]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleOpenPrefs} style={styles.gearBtn}>
          <Ionicons name="settings-outline" size={24} color={COLORS.textSecondary} />
          {!prefs.pushEnabled && <View style={styles.gearDot} />}
        </TouchableOpacity>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'alerts' && styles.tabActive]}
          onPress={() => setActiveTab('alerts')}
        >
          <Text style={[styles.tabText, activeTab === 'alerts' && styles.tabTextActive]}>
            Alerts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved_filters' && styles.tabActive]}
          onPress={() => setActiveTab('saved_filters')}
        >
          <Text style={[styles.tabText, activeTab === 'saved_filters' && styles.tabTextActive]}>
            Saved Filters
          </Text>
          {presets.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{presets.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {activeTab === 'alerts' ? (
        <>
          {/* Push disabled banner */}
          {!prefs.pushEnabled && (
            <TouchableOpacity style={styles.disabledBanner} onPress={handleOpenPrefs}>
              <Ionicons name="notifications-off-outline" size={18} color={COLORS.warning} />
              <Text style={styles.disabledBannerText}>
                Push notifications are off
              </Text>
              <Text style={styles.disabledBannerLink}>Enable</Text>
            </TouchableOpacity>
          )}

          <FlatList
            data={MOCK_NOTIFICATIONS}
            keyExtractor={(item) => item.id}
            renderItem={renderNotification}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="notifications-outline" size={56} color={COLORS.border} />
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptySubtitle}>
                  Get notified about events near you and updates to events you saved
                </Text>
              </View>
            }
          />
        </>
      ) : (
        <FlatList
          data={presets}
          keyExtractor={(item) => item.id}
          renderItem={renderPreset}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="funnel-outline" size={56} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No saved filters</Text>
              <Text style={styles.emptySubtitle}>
                Save a filter combination from the Explore tab to quickly apply it later
              </Text>
            </View>
          }
        />
      )}
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
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT.sizes.title,
    color: COLORS.textPrimary,
    ...FONT.bold,
  },
  gearBtn: {
    padding: SPACING.sm,
    position: 'relative',
  },
  gearDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.warning,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT.sizes.md,
    color: COLORS.textTertiary,
    ...FONT.medium,
  },
  tabTextActive: {
    color: COLORS.primary,
    ...FONT.semibold,
  },
  tabBadge: {
    backgroundColor: COLORS.primary + '18',
    borderRadius: RADIUS.full,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  tabBadgeText: {
    fontSize: FONT.sizes.xs,
    color: COLORS.primary,
    ...FONT.bold,
  },

  // Disabled banner
  disabledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warning + '12',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  disabledBannerText: {
    flex: 1,
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
  },
  disabledBannerLink: {
    fontSize: FONT.sizes.sm,
    color: COLORS.primary,
    ...FONT.semibold,
  },

  // List
  listContent: {
    paddingTop: SPACING.sm,
    paddingBottom: 100,
  },

  // Notification item
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  notifItemUnread: {
    backgroundColor: COLORS.primary + '06',
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: FONT.sizes.md,
    color: COLORS.textPrimary,
    ...FONT.semibold,
    marginBottom: 2,
  },
  notifBody: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  notifTime: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },

  // Preset item
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  presetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
    marginRight: SPACING.md,
  },
  presetText: {
    flex: 1,
  },
  presetName: {
    fontSize: FONT.sizes.md,
    color: COLORS.textPrimary,
    ...FONT.medium,
  },
  presetSummary: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  presetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  presetApplyBtn: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  presetApplyText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.primary,
    ...FONT.semibold,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT.sizes.lg,
    color: COLORS.textSecondary,
    ...FONT.semibold,
  },
  emptySubtitle: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 60,
    lineHeight: 20,
  },
});
