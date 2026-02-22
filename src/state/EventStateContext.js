import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { MOCK_EVENTS } from '../data/mockEvents';
import { IS_SUPABASE_CONFIGURED } from '../config/supabase';
import * as eventService from '../services/eventService';

const EventStateContext = createContext(null);

export function EventStateProvider({ children }) {
  // Saved event IDs
  const [savedIds, setSavedIds] = useState(new Set());

  // Local overrides for counters (share_count, save_count, ratings)
  const [overrides, setOverrides] = useState({});

  // Current user ID (set from outside via setUserId)
  const [userId, setUserId] = useState(null);

  // ── Load saved IDs from backend on mount ──
  useEffect(() => {
    if (!userId || !IS_SUPABASE_CONFIGURED) return;
    (async () => {
      const { data } = await eventService.fetchSavedEventIds(userId);
      if (data && data.length > 0) {
        setSavedIds(new Set(data));
      }
    })();
  }, [userId]);

  // ── Save / Unsave ──
  const toggleSave = useCallback((eventId) => {
    const wasSaved = savedIds.has(eventId);

    // Optimistic UI update
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });

    setOverrides((prev) => {
      const current = prev[eventId] || { save_count_delta: 0, share_count_delta: 0, user_rating: null };
      return {
        ...prev,
        [eventId]: {
          ...current,
          save_count_delta: current.save_count_delta + (wasSaved ? -1 : 1),
        },
      };
    });

    // Persist to backend (fire-and-forget)
    if (userId) {
      eventService.toggleSaveEvent(userId, eventId, wasSaved);
    }
  }, [savedIds, userId]);

  const isSaved = useCallback((eventId) => savedIds.has(eventId), [savedIds]);

  // ── Share tracking ──
  const trackShare = useCallback((eventId) => {
    setOverrides((prev) => {
      const current = prev[eventId] || { save_count_delta: 0, share_count_delta: 0, user_rating: null };
      return {
        ...prev,
        [eventId]: {
          ...current,
          share_count_delta: current.share_count_delta + 1,
        },
      };
    });

    if (userId) {
      eventService.logShare(userId, eventId);
    }
  }, [userId]);

  // ── Star rating ──
  const submitRating = useCallback((eventId, stars) => {
    setOverrides((prev) => {
      const current = prev[eventId] || { save_count_delta: 0, share_count_delta: 0, user_rating: null };
      return {
        ...prev,
        [eventId]: {
          ...current,
          user_rating: stars,
        },
      };
    });

    if (userId) {
      eventService.submitRating(userId, eventId, stars);
    }
  }, [userId]);

  // ── Get enriched event data ──
  const getEventWithOverrides = useCallback((event) => {
    const o = overrides[event.id];
    if (!o) return { ...event, _isSaved: savedIds.has(event.id), _userRating: null };
    return {
      ...event,
      save_count: Math.max(0, (event.save_count || 0) + (o.save_count_delta || 0)),
      share_count: Math.max(0, (event.share_count || 0) + (o.share_count_delta || 0)),
      _isSaved: savedIds.has(event.id),
      _userRating: o.user_rating,
    };
  }, [overrides, savedIds]);

  // ── Saved events list ──
  const savedEvents = useMemo(() => {
    return MOCK_EVENTS.filter((e) => savedIds.has(e.id)).map(getEventWithOverrides);
  }, [savedIds, getEventWithOverrides]);

  const value = useMemo(() => ({
    toggleSave,
    isSaved,
    trackShare,
    submitRating,
    getEventWithOverrides,
    savedEvents,
    savedIds,
    setUserId,
  }), [toggleSave, isSaved, trackShare, submitRating, getEventWithOverrides, savedEvents, savedIds]);

  return (
    <EventStateContext.Provider value={value}>
      {children}
    </EventStateContext.Provider>
  );
}

export function useEventState() {
  const ctx = useContext(EventStateContext);
  if (!ctx) throw new Error('useEventState must be used within EventStateProvider');
  return ctx;
}
