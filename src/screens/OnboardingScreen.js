import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, FONT } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STORAGE_KEY = '@eventmap_onboarding_done';

const SLIDES = [
  {
    id: '1',
    icon: 'map',
    iconColor: COLORS.primary,
    iconBg: COLORS.primary + '15',
    title: 'Discover events\naround Toronto',
    subtitle: 'Find concerts, markets, meetups, and more happening near you — all on an interactive map.',
  },
  {
    id: '2',
    icon: 'funnel',
    iconColor: '#FF9500',
    iconBg: '#FF9500' + '15',
    title: 'Filter by what\nyou love',
    subtitle: 'Search by category, date, distance, and price. Save your favourite filter combos for one-tap access.',
  },
  {
    id: '3',
    icon: 'add-circle',
    iconColor: '#34C759',
    iconBg: '#34C759' + '15',
    title: 'Share events\nwith your city',
    subtitle: 'Verify your phone and start posting events. Rate, save, and share events with the community.',
  },
];

export default function OnboardingScreen({ onComplete }) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleDone();
    }
  }, [currentIndex]);

  const handleDone = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'true').catch(() => {});
    onComplete?.();
  }, [onComplete]);

  const handleSkip = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'true').catch(() => {});
    onComplete?.();
  }, [onComplete]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const isLast = currentIndex === SLIDES.length - 1;

  const renderSlide = useCallback(({ item }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={56} color={item.iconColor} />
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
    </View>
  ), []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Skip button */}
      <View style={styles.topRow}>
        <View />
        {!isLast && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { width: dotWidth, opacity: dotOpacity },
                ]}
              />
            );
          })}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
          {!isLast && (
            <Ionicons name="arrow-forward" size={18} color={COLORS.textInverse} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Check if onboarding has been completed
export async function hasCompletedOnboarding() {
  try {
    const done = await AsyncStorage.getItem(STORAGE_KEY);
    return done === 'true';
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  skipBtn: {
    padding: SPACING.sm,
  },
  skipText: {
    fontSize: FONT.sizes.md,
    color: COLORS.textTertiary,
    ...FONT.medium,
  },

  // Slide
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxxl + SPACING.lg,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  slideTitle: {
    fontSize: 30,
    color: COLORS.textPrimary,
    ...FONT.bold,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: SPACING.lg,
  },
  slideSubtitle: {
    fontSize: FONT.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Bottom
  bottomSection: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    gap: SPACING.xxl,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg + 2,
    borderRadius: RADIUS.lg,
  },
  nextBtnText: {
    color: COLORS.textInverse,
    fontSize: FONT.sizes.lg,
    ...FONT.semibold,
  },
});
