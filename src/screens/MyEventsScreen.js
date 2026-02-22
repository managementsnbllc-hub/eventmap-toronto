import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT, CATEGORY_CONFIG } from '../constants/theme';
import { useAuth } from '../state/AuthContext';
import { fetchMyEvents, cancelEvent } from '../services/eventService';
import { MOCK_EVENTS } from '../data/mockEvents';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-CA', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-CA', {
    hour: 'numeric', minute: '2-digit',
  });
}

export default function MyEventsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, isVerified } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    if (isVerified && user?.id) {
      const { data } = await fetchMyEvents(user.id);
      setEvents(data || []);
    } else {
      // For stub/demo: show events with creator_name 'You'
      setEvents(MOCK_EVENTS.filter((e) => e.creator_name === 'You'));
    }
    setLoading(false);
  }, [user, isVerified]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Reload when returning from edit
  useEffect(() => {
    const unsub = navigation.addListener('focus', loadEvents);
    return unsub;
  }, [navigation, loadEvents]);

  const handleEdit = useCallback((event) => {
    navigation.navigate('CreateEvent', { event });
  }, [navigation]);

  const handleCancel = useCallback((event) => {
    Alert.alert(
      'Cancel Event',
      `Cancel "${event.title}"? This cannot be undone.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Event',
          style: 'destructive',
          onPress: async () => {
            await cancelEvent(event.id);
            setEvents((prev) => prev.filter((e) => e.id !== event.id));
          },
        },
      ],
    );
  }, []);

  const handleViewDetail = useCallback((event) => {
    navigation.navigate('EventDetail', { event });
  }, [navigation]);

  const renderEvent = useCallback(({ item }) => {
    const cat = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;
    const isPast = new Date(item.ends_at) < new Date();
    const statusLabel = item.status === 'cancelled' ? 'Cancelled' : isPast ? 'Past' : 'Active';
    const statusColor = item.status === 'cancelled' ? COLORS.error : isPast ? COLORS.textTertiary : '#34C759';

    return (
      <TouchableOpacity style={styles.eventCard} onPress={() => handleViewDetail(item)}>
        {/* Color bar */}
        <View style={[styles.colorBar, { backgroundColor: cat.color }]} />

        <View style={styles.eventContent}>
          {/* Header row */}
          <View style={styles.eventHeader}>
            <View style={styles.eventHeaderLeft}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
              <View style={[styles.categoryChip, { backgroundColor: cat.color + '15' }]}>
                <Ionicons name={cat.icon} size={12} color={cat.color} />
                <Text style={[styles.categoryChipText, { color: cat.color }]}>{cat.label}</Text>
              </View>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>

          {/* Date & venue */}
          <View style={styles.eventMeta}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textTertiary} />
            <Text style={styles.eventMetaText}>
              {formatDate(item.starts_at)} · {formatTime(item.starts_at)}
            </Text>
          </View>
          {item.venue_name && (
            <View style={styles.eventMeta}>
              <Ionicons name="location-outline" size={14} color={COLORS.textTertiary} />
              <Text style={styles.eventMetaText} numberOfLines={1}>{item.venue_name}</Text>
            </View>
          )}
          {item.event_mode !== 'in_person' && (
            <View style={styles.eventMeta}>
              <Ionicons name="videocam-outline" size={14} color={COLORS.textTertiary} />
              <Text style={styles.eventMetaText}>
                {item.event_mode === 'online' ? 'Online' : 'Hybrid'}
              </Text>
            </View>
          )}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="bookmark-outline" size={14} color={COLORS.textTertiary} />
              <Text style={styles.statText}>{item.save_count || 0}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="share-outline" size={14} color={COLORS.textTertiary} />
              <Text style={styles.statText}>{item.share_count || 0}</Text>
            </View>
            {item.avg_rating && (
              <View style={styles.stat}>
                <Ionicons name="star" size={14} color="#FFB800" />
                <Text style={styles.statText}>{item.avg_rating}</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          {!isPast && item.status !== 'cancelled' && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleEdit(item)}
              >
                <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                <Text style={styles.actionBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnDanger]}
                onPress={() => handleCancel(item)}
              >
                <Ionicons name="close-circle-outline" size={16} color={COLORS.error} />
                <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [handleEdit, handleCancel, handleViewDetail]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Events</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Ionicons name="add" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : events.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="calendar-outline" size={56} color={COLORS.border} />
          <Text style={styles.emptyTitle}>No events yet</Text>
          <Text style={styles.emptySubtitle}>
            Events you create will appear here
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('CreateEvent')}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.emptyBtnText}>Create Your First Event</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT.sizes.xl,
    color: COLORS.textPrimary,
    ...FONT.bold,
  },
  createBtn: {
    padding: SPACING.xs,
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xxl,
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
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    marginTop: SPACING.md,
  },
  emptyBtnText: {
    fontSize: FONT.sizes.md,
    color: '#fff',
    ...FONT.semibold,
  },

  listContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: 100,
  },

  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  colorBar: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },

  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: FONT.sizes.xs,
    ...FONT.semibold,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  categoryChipText: {
    fontSize: FONT.sizes.xs,
    ...FONT.medium,
  },

  eventTitle: {
    fontSize: FONT.sizes.md,
    color: COLORS.textPrimary,
    ...FONT.semibold,
    lineHeight: 22,
  },

  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventMetaText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textTertiary,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    marginTop: 2,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    ...FONT.medium,
  },

  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '12',
  },
  actionBtnText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.primary,
    ...FONT.medium,
  },
  actionBtnDanger: {
    backgroundColor: COLORS.error + '12',
  },
  actionBtnTextDanger: {
    color: COLORS.error,
  },
});
