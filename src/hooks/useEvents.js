// ─── useEvents Hook ───
// Fetches events from the service layer and applies local filtering/sorting.
// Screens consume this instead of importing MOCK_EVENTS directly.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchEvents } from '../services/eventService';
import { IS_SUPABASE_CONFIGURED } from '../config/supabase';
import { MOCK_EVENTS } from '../data/mockEvents';
import {
  DEFAULT_FILTERS, filterEvents, sortEvents, getTimeRange,
  getActiveFilterCount, getFilterSummary,
} from '../utils/filterEngine';

export default function useEvents(initialFilters = DEFAULT_FILTERS) {
  const [allEvents, setAllEvents] = useState(MOCK_EVENTS);
  const [filters, setFilters] = useState({ ...initialFilters });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Fetch from backend ──
  const loadEvents = useCallback(async () => {
    if (!IS_SUPABASE_CONFIGURED) {
      // Running on mocks — no network needed
      setAllEvents(MOCK_EVENTS);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { start, end } = getTimeRange(
        filters.timeRange,
        filters.customDateStart,
        filters.customDateEnd
      );
      const { data, error: fetchError } = await fetchEvents({
        fromDate: start.toISOString(),
        toDate: end.toISOString(),
      });
      if (fetchError) throw new Error(fetchError);
      setAllEvents(data);
    } catch (err) {
      console.error('[useEvents]', err.message);
      setError(err.message);
      // Fall back to mocks on error
      setAllEvents(MOCK_EVENTS);
    } finally {
      setLoading(false);
    }
  }, [filters.timeRange, filters.customDateStart, filters.customDateEnd]);

  // Fetch on mount and when time range changes
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // ── Local filter + sort (applied in-memory on fetched data) ──
  const filteredEvents = useMemo(
    () => filterEvents(allEvents, filters),
    [allEvents, filters]
  );

  const sortedEvents = useMemo(
    () => sortEvents(filteredEvents, filters.sortBy),
    [filteredEvents, filters.sortBy]
  );

  const activeFilterCount = useMemo(() => getActiveFilterCount(filters), [filters]);
  const filterSummary = useMemo(() => getFilterSummary(filters), [filters]);

  return {
    events: sortedEvents,
    allEvents,
    filters,
    setFilters,
    loading,
    error,
    refetch: loadEvents,
    activeFilterCount,
    filterSummary,
  };
}
