import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
  Linking, Share, Alert, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT, SHADOWS, CATEGORY_CONFIG } from '../constants/theme';
import { formatTimeRange, formatEventTime, getDistanceText } from '../data/mockEvents';
import { useEventState } from '../state/EventStateContext';
import { useAuth } from '../state/AuthContext';
import { reportEvent as reportEventAPI } from '../services/eventService';
import StarRating from '../components/StarRating';
import { showToast } from '../components/Toast';
import { haptic } from '../utils/haptics';

export default function EventDetailScreen({ route, navigation }) {
  const { event: rawEvent } = route.params;
  const insets = useSafeAreaInsets();
  const { getEventWithOverrides, toggleSave, trackShare, submitRating, isSaved } = useEventState();
  const { user } = useAuth();

  const event = useMemo(() => getEventWithOverrides(rawEvent), [rawEvent, getEventWithOverrides]);
  const saved = isSaved(event.id);
  const cat = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.other;
  const distance = getDistanceText(event);
  const isOnline = event.event_mode === 'online';
  const isHybrid = event.event_mode === 'hybrid';

  const [showRatingInput, setShowRatingInput] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  // ── Actions ──

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleEdit = useCallback(() => {
    navigation.navigate('CreateEvent', { event: rawEvent });
  }, [navigation, rawEvent]);

  const handleSave = useCallback(() => {
    const wasSaved = isSaved(event.id);
    haptic.light();
    toggleSave(event.id);
    showToast(wasSaved ? 'Removed from saved' : 'Event saved', wasSaved ? 'info' : 'success');
  }, [event.id, toggleSave, isSaved]);

  const handleShare = useCallback(async () => {
    try {
      const result = await Share.share({
        title: event.title,
        message: `Check out "${event.title}" on EventMap Toronto!\n${event.venue_name || 'Online event'}`,
      });
      if (result.action === Share.sharedAction) {
        trackShare(event.id);
        showToast('Shared successfully', 'success');
      }
    } catch (e) {
      // User cancelled share
    }
  }, [event, trackShare]);

  const handleDirections = useCallback(() => {
    if (!event.latitude || !event.longitude) return;
    const url = Platform.select({
      ios: `maps:?daddr=${event.latitude},${event.longitude}`,
      android: `google.navigation:q=${event.latitude},${event.longitude}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
      );
    });
  }, [event]);

  const handleCall = useCallback(() => {
    // Placeholder — would use venue phone number from backend
    Alert.alert('Call Venue', 'Phone number not available in MVP.\nThis will connect to venue details from the backend.');
  }, []);

  const handleTicketLink = useCallback(() => {
    if (event.online_link) {
      Linking.openURL(event.online_link).catch(() => {
        Alert.alert('Cannot open link', 'The link could not be opened.');
      });
    } else {
      Alert.alert('Tickets', 'Ticket/reservation link not available for this event.');
    }
  }, [event.online_link]);

  const handleRateSubmit = useCallback((stars) => {
    haptic.success();
    submitRating(event.id, stars);
    setShowRatingInput(false);
    showToast(`Rated ${stars} star${stars > 1 ? 's' : ''}`, 'success');
  }, [event.id, submitRating]);

  const handleReport = useCallback(() => {
    Alert.alert(
      'Report Event',
      'Flag this event for review? Our team will investigate.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            if (user?.id) {
              await reportEventAPI(user.id, event.id, 'other');
            }
            setReportSent(true);
          },
        },
      ],
    );
  }, [event.id, user]);

  // ── Format dates ──
  const startDate = new Date(event.starts_at);
  const dateString = startDate.toLocaleDateString('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.headerBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          {event.creator_name === 'You' && (
            <TouchableOpacity onPress={handleEdit} style={styles.headerBtn}>
              <Ionicons name="create-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={saved ? COLORS.primary : COLORS.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
            <Ionicons name="share-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cover image ── */}
        {event.cover_image_url ? (
          <Image source={{ uri: event.cover_image_url }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name={cat.icon} size={48} color={cat.color + '60'} />
          </View>
        )}

        {/* ── Main info ── */}
        <View style={styles.mainSection}>
          {/* Category + mode badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.categoryBadge, { backgroundColor: cat.color + '18' }]}>
              <Ionicons name={cat.icon} size={13} color={cat.color} />
              <Text style={[styles.categoryBadgeText, { color: cat.color }]}>{cat.label}</Text>
            </View>
            {isOnline && (
              <View style={styles.modeBadge}>
                <Ionicons name="videocam" size={12} color={COLORS.info} />
                <Text style={[styles.modeBadgeText, { color: COLORS.info }]}>Online</Text>
              </View>
            )}
            {isHybrid && (
              <View style={styles.modeBadge}>
                <Ionicons name="git-merge-outline" size={12} color={COLORS.primary} />
                <Text style={[styles.modeBadgeText, { color: COLORS.primary }]}>Hybrid</Text>
              </View>
            )}
            {event.is_recurring && (
              <View style={styles.modeBadge}>
                <Ionicons name="repeat" size={12} color={COLORS.textTertiary} />
                <Text style={styles.modeBadgeText}>Recurring</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Creator */}
          <Text style={styles.creator}>Posted by {event.creator_name}</Text>

          {/* Rating summary */}
          <View style={styles.ratingRow}>
            <StarRating rating={event.avg_rating || 0} size={18} />
            <Text style={styles.ratingText}>
              {event.avg_rating || '—'}
            </Text>
            <Text style={styles.ratingCount}>
              ({event.rating_count || 0} rating{event.rating_count !== 1 ? 's' : ''})
            </Text>
          </View>
        </View>

        {/* ── Details cards ── */}
        <View style={styles.detailsSection}>
          {/* Date & Time */}
          <View style={styles.detailCard}>
            <View style={[styles.detailIcon, { backgroundColor: COLORS.primary + '12' }]}>
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>{dateString}</Text>
              <Text style={styles.detailSub}>
                {formatTimeRange(event.starts_at, event.ends_at)}
              </Text>
            </View>
          </View>

          {/* Location (in-person / hybrid) */}
          {event.venue_name && (
            <TouchableOpacity style={styles.detailCard} onPress={handleDirections}>
              <View style={[styles.detailIcon, { backgroundColor: COLORS.success + '12' }]}>
                <Ionicons name="location" size={20} color={COLORS.success} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{event.venue_name}</Text>
                <Text style={styles.detailSub}>{event.address_text}</Text>
                {distance && (
                  <Text style={styles.detailDistance}>{distance} away</Text>
                )}
              </View>
              <Ionicons name="navigate-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          )}

          {/* Online link */}
          {(isOnline || isHybrid) && event.online_link && (
            <TouchableOpacity style={styles.detailCard} onPress={handleTicketLink}>
              <View style={[styles.detailIcon, { backgroundColor: COLORS.info + '12' }]}>
                <Ionicons name="videocam" size={20} color={COLORS.info} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Join Online</Text>
                <Text style={styles.detailValue}>
                  {event.online_platform ? event.online_platform.charAt(0).toUpperCase() + event.online_platform.slice(1) : 'Virtual event'}
                </Text>
                {event.online_instructions && (
                  <Text style={styles.detailSub}>{event.online_instructions}</Text>
                )}
              </View>
              <Ionicons name="open-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          )}

          {/* Price */}
          <View style={styles.detailCard}>
            <View style={[styles.detailIcon, { backgroundColor: COLORS.warning + '12' }]}>
              <Ionicons name="pricetag" size={20} color={COLORS.warning} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Price</Text>
              <Text style={styles.detailValue}>{event.price_text || 'Not specified'}</Text>
            </View>
          </View>
        </View>

        {/* ── Action buttons ── */}
        <View style={styles.actionRow}>
          {event.latitude && (
            <TouchableOpacity style={styles.actionBtn} onPress={handleDirections}>
              <View style={[styles.actionCircle, { backgroundColor: COLORS.primary + '12' }]}>
                <Ionicons name="navigate" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.actionLabel}>Directions</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
            <View style={[styles.actionCircle, { backgroundColor: COLORS.success + '12' }]}>
              <Ionicons name="call" size={22} color={COLORS.success} />
            </View>
            <Text style={styles.actionLabel}>Call</Text>
          </TouchableOpacity>
          {(event.online_link || event.price_text?.startsWith('$')) && (
            <TouchableOpacity style={styles.actionBtn} onPress={handleTicketLink}>
              <View style={[styles.actionCircle, { backgroundColor: COLORS.info + '12' }]}>
                <Ionicons name="ticket" size={22} color={COLORS.info} />
              </View>
              <Text style={styles.actionLabel}>
                {event.online_link ? 'Join' : 'Tickets'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <View style={[styles.actionCircle, { backgroundColor: COLORS.textTertiary + '18' }]}>
              <Ionicons name="share-social" size={22} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
            <View style={[styles.actionCircle, { backgroundColor: saved ? COLORS.primary + '18' : COLORS.textTertiary + '18' }]}>
              <Ionicons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={saved ? COLORS.primary : COLORS.textSecondary}
              />
            </View>
            <Text style={[styles.actionLabel, saved && { color: COLORS.primary }]}>
              {saved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Description ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="bookmark" size={16} color={COLORS.textTertiary} />
            <Text style={styles.statValue}>{event.save_count}</Text>
            <Text style={styles.statLabel}>saves</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="share-social" size={16} color={COLORS.textTertiary} />
            <Text style={styles.statValue}>{event.share_count}</Text>
            <Text style={styles.statLabel}>shares</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="star" size={16} color={COLORS.warning} />
            <Text style={styles.statValue}>{event.avg_rating || '—'}</Text>
            <Text style={styles.statLabel}>rating</Text>
          </View>
        </View>

        {/* ── Rate this event ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate this event</Text>
          {event._userRating ? (
            <View style={styles.ratedRow}>
              <StarRating rating={event._userRating} size={28} />
              <Text style={styles.ratedText}>
                You rated this {event._userRating} star{event._userRating !== 1 ? 's' : ''}
              </Text>
            </View>
          ) : showRatingInput ? (
            <View style={styles.rateInputContainer}>
              <Text style={styles.ratePrompt}>Tap a star to rate</Text>
              <StarRating rating={0} size={36} interactive onRate={handleRateSubmit} />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.rateBtn}
              onPress={() => setShowRatingInput(true)}
            >
              <Ionicons name="star-outline" size={18} color={COLORS.primary} />
              <Text style={styles.rateBtnText}>Leave a rating</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Report ── */}
        <View style={styles.reportSection}>
          {reportSent ? (
            <View style={styles.reportSentRow}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              <Text style={styles.reportSentText}>Report submitted. Thank you.</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.reportBtn} onPress={handleReport}>
              <Ionicons name="flag-outline" size={16} color={COLORS.textTertiary} />
              <Text style={styles.reportBtnText}>Report this event</Text>
            </TouchableOpacity>
          )}
        </View>

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerBtn: {
    padding: SPACING.sm,
  },
  headerRight: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Cover
  coverImage: {
    height: 220,
    width: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    height: 180,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Main info
  mainSection: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  categoryBadgeText: {
    fontSize: FONT.sizes.sm,
    ...FONT.semibold,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  modeBadgeText: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    ...FONT.medium,
  },
  title: {
    fontSize: FONT.sizes.title,
    color: COLORS.textPrimary,
    ...FONT.bold,
    lineHeight: 34,
    marginBottom: 6,
  },
  creator: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textTertiary,
    marginBottom: SPACING.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  ratingText: {
    fontSize: FONT.sizes.md,
    color: COLORS.textPrimary,
    ...FONT.semibold,
  },
  ratingCount: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textTertiary,
  },

  // Detail cards
  detailsSection: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    gap: SPACING.lg,
  },
  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    ...FONT.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FONT.sizes.md,
    color: COLORS.textPrimary,
    ...FONT.semibold,
  },
  detailSub: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  detailDistance: {
    fontSize: FONT.sizes.xs,
    color: COLORS.primary,
    ...FONT.medium,
    marginTop: 3,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 6,
  },
  actionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textSecondary,
    ...FONT.medium,
  },

  // Sections
  section: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT.sizes.lg,
    color: COLORS.textPrimary,
    ...FONT.semibold,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    gap: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.lg,
  },
  statValue: {
    fontSize: FONT.sizes.xl,
    color: COLORS.textPrimary,
    ...FONT.bold,
  },
  statLabel: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },

  // Rating
  ratedRow: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  ratedText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
  },
  rateInputContainer: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  ratePrompt: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textTertiary,
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  rateBtnText: {
    fontSize: FONT.sizes.md,
    color: COLORS.primary,
    ...FONT.medium,
  },

  // Report
  reportSection: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: SPACING.md,
  },
  reportBtnText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textTertiary,
    ...FONT.medium,
  },
  reportSentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportSentText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.success,
    ...FONT.medium,
  },
});
