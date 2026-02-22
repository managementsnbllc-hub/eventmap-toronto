import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT, SHADOWS, CATEGORY_CONFIG } from '../constants/theme';
import { formatTimeRange, getDistanceText } from '../data/mockEvents';

export default function EventCard({ event, onPress, onSave, isSaved }) {
  const cat = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.other;
  const distance = getDistanceText(event);
  const isOnline = event.event_mode === 'online';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(event)}
      activeOpacity={0.7}
    >
      {/* Top row: category tag + distance */}
      <View style={styles.topRow}>
        <View style={[styles.categoryTag, { backgroundColor: cat.color + '18' }]}>
          <Ionicons name={cat.icon} size={12} color={cat.color} />
          <Text style={[styles.categoryText, { color: cat.color }]}>{cat.label}</Text>
        </View>
        <View style={styles.topRight}>
          {isOnline && (
            <View style={styles.onlineBadge}>
              <Ionicons name="videocam" size={11} color={COLORS.info} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          )}
          {distance && !isOnline && (
            <Text style={styles.distanceText}>{distance}</Text>
          )}
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>{event.title}</Text>

      {/* Venue */}
      {event.venue_name && (
        <View style={styles.venueRow}>
          <Ionicons name="location-outline" size={13} color={COLORS.textTertiary} />
          <Text style={styles.venueText} numberOfLines={1}>{event.venue_name}</Text>
        </View>
      )}

      {/* Bottom row: time, price, rating, save */}
      <View style={styles.bottomRow}>
        <View style={styles.bottomLeft}>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.timeText}>{formatTimeRange(event.starts_at, event.ends_at)}</Text>
          </View>
          {event.price_text && (
            <Text style={styles.priceText}>{event.price_text}</Text>
          )}
        </View>

        <View style={styles.bottomRight}>
          {event.avg_rating && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={COLORS.warning} />
              <Text style={styles.ratingText}>{event.avg_rating}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => onSave?.(event)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? COLORS.primary : COLORS.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Recurring badge */}
      {event.is_recurring && (
        <View style={styles.recurringBadge}>
          <Ionicons name="repeat" size={11} color={COLORS.textTertiary} />
          <Text style={styles.recurringText}>Recurring</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  categoryText: {
    fontSize: FONT.sizes.xs,
    ...FONT.semibold,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  onlineText: {
    fontSize: FONT.sizes.xs,
    color: COLORS.info,
    ...FONT.medium,
  },
  distanceText: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    ...FONT.medium,
  },
  title: {
    fontSize: FONT.sizes.lg,
    color: COLORS.textPrimary,
    ...FONT.semibold,
    marginBottom: 4,
    lineHeight: 22,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.md,
  },
  venueText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textTertiary,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bottomLeft: {
    flex: 1,
    gap: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.medium,
  },
  priceText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.primary,
    ...FONT.semibold,
  },
  bottomRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.medium,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  recurringText: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
  },
});
