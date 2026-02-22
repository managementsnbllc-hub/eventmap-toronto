import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, StatusBar,
  Keyboard, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT, SHADOWS } from '../constants/theme';
import EventCard from '../components/EventCard';
import EventPreviewCard from '../components/EventPreviewCard';
import FilterSheet from '../components/FilterSheet';
import EventMap from '../components/map/EventMap';
import { EventListSkeleton } from '../components/Skeletons';
import { DEFAULT_FILTERS } from '../utils/filterEngine';
import { useEventState } from '../state/EventStateContext';
import useEvents from '../hooks/useEvents';

const TIME_FILTERS = [
  { key: 'this_week', label: 'This week' },
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'weekend', label: 'This weekend' },
];

export default function HomeScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef(null);
  const searchInputRef = useRef(null);
  const { toggleSave, isSaved: checkSaved } = useEventState();

  // ── Data from hook ──
  const {
    events: sortedEvents,
    filters, setFilters,
    loading, error, refetch,
    activeFilterCount, filterSummary: filterSummaryText,
  } = useEvents();

  // ── Apply saved filter preset when navigated with params ──
  React.useEffect(() => {
    if (route.params?.applyFilters) {
      setFilters(route.params.applyFilters);
      navigation.setParams({ applyFilters: undefined });
    }
  }, [route.params?.applyFilters]);

  // ── Local UI state ──
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Bottom sheet snap points
  const snapPoints = useMemo(() => ['35%', '55%', '92%'], []);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // ── Derived ──
  const selectedEvent = useMemo(
    () => sortedEvents.find((e) => e.id === selectedEventId) || null,
    [sortedEvents, selectedEventId],
  );

  const timeLabel = useMemo(() => {
    const f = TIME_FILTERS.find((t) => t.key === filters.timeRange);
    return f ? f.label.toLowerCase() : 'this week';
  }, [filters.timeRange]);

  // ── Handlers ──

  const handleSelectPin = useCallback((eventId) => {
    setSelectedEventId(eventId);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleDeselectPin = useCallback(() => {
    setSelectedEventId(null);
  }, []);

  const handleEventCardPress = useCallback((event) => {
    navigation.navigate('EventDetail', { event });
  }, [navigation]);

  const handlePreviewPress = useCallback((event) => {
    navigation.navigate('EventDetail', { event });
  }, [navigation]);

  const handlePreviewClose = useCallback(() => {
    setSelectedEventId(null);
  }, []);

  const handleSave = useCallback((event) => {
    toggleSave(event.id);
  }, [toggleSave]);

  const handleRegionChange = useCallback((region) => {
    setMapRegion(region);
  }, []);

  const handleMyLocation = useCallback(() => {
    console.log('My location tapped');
  }, []);

  // Time chip tap
  const handleTimeChipPress = useCallback((key) => {
    setFilters((prev) => ({ ...prev, timeRange: key }));
  }, []);

  // Search
  const handleSearchChange = useCallback((text) => {
    setFilters((prev) => ({ ...prev, searchQuery: text }));
  }, []);

  const handleSearchClear = useCallback(() => {
    setFilters((prev) => ({ ...prev, searchQuery: '' }));
    searchInputRef.current?.blur();
  }, []);

  const handleSearchSubmit = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  // Filter sheet
  const handleOpenFilters = useCallback(() => {
    setFilterSheetVisible(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setFilterSheetVisible(false);
  }, []);

  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setFilterSheetVisible(false);
  }, []);

  const handleCreateEvent = useCallback(() => {
    navigation.navigate('CreateEvent');
  }, [navigation]);

  const renderEventCard = useCallback(
    ({ item }) => (
      <EventCard
        event={item}
        onPress={handleEventCardPress}
        onSave={handleSave}
        isSaved={checkSaved(item.id)}
      />
    ),
    [handleEventCardPress, handleSave, checkSaved],
  );

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── Map ── */}
      <View style={styles.mapContainer}>
        <EventMap
          events={sortedEvents}
          selectedEventId={selectedEventId}
          onSelectEvent={handleSelectPin}
          onDeselectEvent={handleDeselectPin}
          onRegionChange={handleRegionChange}
        />

        {/* Search bar overlay */}
        <View style={[styles.searchBar, { top: insets.top + SPACING.md }]}>
          <Ionicons name="search" size={18} color={searchFocused ? COLORS.primary : COLORS.textTertiary} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search events in Toronto"
            placeholderTextColor={COLORS.textTertiary}
            value={filters.searchQuery}
            onChangeText={handleSearchChange}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoCorrect={false}
          />
          {filters.searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleSearchClear}>
              <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
          <View style={styles.searchDivider} />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={handleOpenFilters}
          >
            <Ionicons name="options-outline" size={18} color={COLORS.primary} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* My location button */}
        <TouchableOpacity style={styles.myLocationBtn} onPress={handleMyLocation}>
          <Ionicons name="navigate" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Create event FAB */}
        <TouchableOpacity style={styles.createFab} onPress={handleCreateEvent}>
          <Ionicons name="add" size={28} color={COLORS.textInverse} />
        </TouchableOpacity>

        {/* Event preview card */}
        {selectedEvent && (
          <View style={styles.previewContainer}>
            <EventPreviewCard
              event={selectedEvent}
              onPress={handlePreviewPress}
              onClose={handlePreviewClose}
            />
          </View>
        )}
      </View>

      {/* ── Bottom sheet drawer ── */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        enablePanDownToClose={false}
      >
        {/* Drawer header */}
        <View style={styles.drawerHeader}>
          <View style={styles.drawerHeaderLeft}>
            <Text style={styles.drawerTitle}>Events</Text>
            <Text style={styles.drawerSubtitle}>
              {sortedEvents.length} event{sortedEvents.length !== 1 ? 's' : ''} {timeLabel}
              {filterSummaryText ? ` · ${filterSummaryText}` : ''}
            </Text>
          </View>
          {activeFilterCount > 0 && (
            <TouchableOpacity
              style={styles.clearFiltersBtn}
              onPress={() => setFilters({ ...DEFAULT_FILTERS })}
            >
              <Text style={styles.clearFiltersText}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Time filter chips */}
        <View style={styles.chipRow}>
          {TIME_FILTERS.map((f) => {
            const isActive = filters.timeRange === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => handleTimeChipPress(f.key)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.chip, styles.chipIcon]}
            onPress={handleOpenFilters}
          >
            <Ionicons name="filter" size={14} color={COLORS.textSecondary} />
            <Text style={styles.chipText}>More</Text>
          </TouchableOpacity>
        </View>

        {/* Event list */}
        <BottomSheetFlatList
          data={sortedEvents}
          keyExtractor={keyExtractor}
          renderItem={renderEventCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            loading ? (
              <EventListSkeleton count={4} />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={COLORS.border} />
                <Text style={styles.emptyTitle}>No events found</Text>
                <Text style={styles.emptySubtitle}>
                  {filters.searchQuery
                    ? `No results for "${filters.searchQuery}"`
                    : 'Try changing your filters or time range'}
                </Text>
                {(activeFilterCount > 0 || filters.searchQuery) && (
                  <TouchableOpacity
                    style={styles.clearAllBtn}
                    onPress={() => setFilters({ ...DEFAULT_FILTERS })}
                  >
                    <Text style={styles.clearAllBtnText}>Clear all filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }
        />
      </BottomSheet>

      {/* ── Filter sheet modal ── */}
      <FilterSheet
        visible={filterSheetVisible}
        filters={filters}
        onApply={handleApplyFilters}
        onClose={handleCloseFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Map
  mapContainer: {
    flex: 1,
  },

  // Search bar
  searchBar: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : 2,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT.sizes.md,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm,
  },
  searchDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },
  filterButton: {
    padding: SPACING.xs,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.full,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    color: COLORS.textInverse,
    fontSize: 9,
    ...FONT.bold,
  },

  // My location button
  myLocationBtn: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },

  // Create event FAB
  createFab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg + 44 + SPACING.md,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },

  // Event preview
  previewContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: SPACING.md,
  },

  // Bottom sheet
  sheetBackground: {
    backgroundColor: COLORS.drawerBackground,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    ...SHADOWS.lg,
  },
  handleIndicator: {
    backgroundColor: COLORS.drawerHandle,
    width: 36,
    height: 5,
    borderRadius: 3,
  },

  // Drawer header
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  drawerHeaderLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },
  drawerTitle: {
    fontSize: FONT.sizes.xxl,
    color: COLORS.textPrimary,
    ...FONT.bold,
  },
  drawerSubtitle: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  clearFiltersBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    marginTop: 4,
  },
  clearFiltersText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.primary,
    ...FONT.medium,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.medium,
  },
  chipTextActive: {
    color: COLORS.textInverse,
  },

  // List
  listContent: {
    paddingTop: SPACING.sm,
    paddingBottom: 100,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: SPACING.sm,
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
    paddingHorizontal: 40,
  },
  clearAllBtn: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  clearAllBtnText: {
    color: COLORS.primary,
    fontSize: FONT.sizes.sm,
    ...FONT.semibold,
  },
});
