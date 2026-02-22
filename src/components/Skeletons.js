import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

// ── Shimmer effect wrapper ──
function Shimmer({ style, children }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.shimmerBase, style, { opacity }]}>
      {children}
    </Animated.View>
  );
}

// ── Event card skeleton ──
export function EventCardSkeleton() {
  return (
    <View style={styles.cardContainer}>
      <Shimmer style={styles.cardImage} />
      <View style={styles.cardBody}>
        <Shimmer style={styles.cardBadge} />
        <Shimmer style={styles.cardTitle} />
        <Shimmer style={styles.cardSubtitle} />
        <View style={styles.cardRow}>
          <Shimmer style={styles.cardMeta} />
          <Shimmer style={styles.cardMeta} />
        </View>
      </View>
    </View>
  );
}

// ── Event list skeleton (multiple cards) ──
export function EventListSkeleton({ count = 4 }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </View>
  );
}

// ── Map pin skeleton (for map loading) ──
export function MapLoadingSkeleton() {
  return (
    <View style={styles.mapSkeleton}>
      <Shimmer style={styles.mapShimmer} />
      <View style={styles.mapCenter}>
        <Shimmer style={styles.mapDot} />
      </View>
    </View>
  );
}

// ── Detail screen skeleton ──
export function EventDetailSkeleton() {
  return (
    <View style={styles.detailContainer}>
      <Shimmer style={styles.detailCover} />
      <View style={styles.detailBody}>
        <Shimmer style={styles.detailBadge} />
        <Shimmer style={styles.detailTitle} />
        <Shimmer style={styles.detailSubtitle} />
        <View style={{ height: SPACING.xl }} />
        <Shimmer style={styles.detailCard} />
        <View style={{ height: SPACING.md }} />
        <Shimmer style={styles.detailCard} />
        <View style={{ height: SPACING.md }} />
        <Shimmer style={styles.detailCard} />
        <View style={{ height: SPACING.xl }} />
        <Shimmer style={styles.detailParagraph} />
        <Shimmer style={styles.detailParagraph} />
        <Shimmer style={[styles.detailParagraph, { width: '60%' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shimmerBase: {
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.md,
  },

  // Event card skeleton
  cardContainer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.md,
  },
  cardBody: {
    flex: 1,
    gap: SPACING.sm,
  },
  cardBadge: {
    width: 60,
    height: 18,
    borderRadius: RADIUS.full,
  },
  cardTitle: {
    width: '85%',
    height: 16,
  },
  cardSubtitle: {
    width: '60%',
    height: 14,
  },
  cardRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cardMeta: {
    width: 70,
    height: 12,
  },

  // List skeleton
  listContainer: {
    paddingTop: SPACING.sm,
  },

  // Map loading
  mapSkeleton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapShimmer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
  },
  mapCenter: {
    position: 'absolute',
  },
  mapDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },

  // Detail skeleton
  detailContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  detailCover: {
    width: '100%',
    height: 200,
    borderRadius: 0,
  },
  detailBody: {
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  detailBadge: {
    width: 80,
    height: 22,
    borderRadius: RADIUS.full,
  },
  detailTitle: {
    width: '75%',
    height: 24,
  },
  detailSubtitle: {
    width: '50%',
    height: 16,
  },
  detailCard: {
    width: '100%',
    height: 64,
    borderRadius: RADIUS.lg,
  },
  detailParagraph: {
    width: '100%',
    height: 14,
    marginBottom: 4,
  },
});
