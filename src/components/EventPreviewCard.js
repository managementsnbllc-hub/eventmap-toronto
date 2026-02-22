import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT, SHADOWS, CATEGORY_CONFIG } from '../constants/theme';
import { formatTimeRange, getDistanceText } from '../data/mockEvents';

export default function EventPreviewCard({ event, onPress, onClose }) {
  if (!event) return null;

  const cat = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.other;
  const distance = getDistanceText(event);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(event)}
      activeOpacity={0.85}
    >
      {/* Close button */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={onClose}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="close-circle-outline" size={22} color={COLORS.textTertiary} />
      </TouchableOpacity>

      {/* Category color bar */}
      <View style={[styles.colorBar, { backgroundColor: cat.color }]} />

      <View style={styles.content}>
        {/* Top: category + distance */}
        <View style={styles.topRow}>
          <View style={[styles.categoryPill, { backgroundColor: cat.color + '18' }]}>
            <Ionicons name={cat.icon} size={11} color={cat.color} />
            <Text style={[styles.categoryText, { color: cat.color }]}>{cat.label}</Text>
          </View>
          {distance && (
            <Text style={styles.distance}>{distance}</Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>{event.title}</Text>

        {/* Details row */}
        <View style={styles.detailsRow}>
          {event.venue_name && (
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={12} color={COLORS.textTertiary} />
              <Text style={styles.detailText} numberOfLines={1}>{event.venue_name}</Text>
            </View>
          )}
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={12} color={COLORS.textTertiary} />
            <Text style={styles.detailText}>
              {formatTimeRange(event.starts_at, event.ends_at)}
            </Text>
          </View>
        </View>

        {/* Bottom: price + rating + arrow */}
        <View style={styles.bottomRow}>
          <View style={styles.bottomLeft}>
            {event.price_text && (
              <Text style={styles.price}>{event.price_text}</Text>
            )}
            {event.avg_rating && (
              <View style={styles.rating}>
                <Ionicons name="star" size={11} color={COLORS.warning} />
                <Text style={styles.ratingText}>{event.avg_rating}</Text>
                <Text style={styles.ratingCount}>({event.rating_count})</Text>
              </View>
            )}
          </View>
          <View style={styles.arrowContainer}>
            <Text style={styles.viewText}>View</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  colorBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
    paddingLeft: SPACING.md,
  },
  closeBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingRight: SPACING.xl,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 3,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  distance: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    ...FONT.medium,
  },
  title: {
    fontSize: FONT.sizes.md,
    color: COLORS.textPrimary,
    ...FONT.semibold,
    marginBottom: 4,
    paddingRight: SPACING.xl,
  },
  detailsRow: {
    gap: 3,
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  price: {
    fontSize: FONT.sizes.sm,
    color: COLORS.primary,
    ...FONT.semibold,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textSecondary,
    ...FONT.medium,
  },
  ratingCount: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.primary,
    ...FONT.medium,
  },
});
