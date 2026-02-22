import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT } from '../constants/theme';
import { useEventState } from '../state/EventStateContext';
import EventCard from '../components/EventCard';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { savedEvents, toggleSave, isSaved } = useEventState();

  const handlePress = useCallback((event) => {
    navigation.navigate('EventDetail', { event });
  }, [navigation]);

  const handleSave = useCallback((event) => {
    toggleSave(event.id);
  }, [toggleSave]);

  const renderItem = useCallback(({ item }) => (
    <EventCard
      event={item}
      onPress={handlePress}
      onSave={handleSave}
      isSaved={isSaved(item.id)}
    />
  ), [handlePress, handleSave, isSaved]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Saved</Text>
      {savedEvents.length > 0 && (
        <Text style={styles.count}>
          {savedEvents.length} event{savedEvents.length !== 1 ? 's' : ''} saved
        </Text>
      )}
      <FlatList
        data={savedEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={56} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No saved events</Text>
            <Text style={styles.emptySubtitle}>
              Tap the bookmark icon on any event to save it here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    fontSize: FONT.sizes.title,
    color: COLORS.textPrimary,
    ...FONT.bold,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  count: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  listContent: {
    paddingTop: SPACING.sm,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
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
