// ─── Event Service ───
// All event data operations. Uses Supabase when configured, falls back to mocks.

import { supabase, IS_SUPABASE_CONFIGURED } from '../config/supabase';
import { MOCK_EVENTS } from '../data/mockEvents';

// ───────────────────────────────────
// READ
// ───────────────────────────────────

/**
 * Fetch events within a date range, with optional geo/category filters.
 * Returns { data: Event[], error: string|null }
 */
export async function fetchEvents({
  fromDate,
  toDate,
  category = null,
  lat = null,
  lng = null,
  radiusKm = null,
} = {}) {
  if (!IS_SUPABASE_CONFIGURED) {
    // ── Mock fallback ──
    let events = [...MOCK_EVENTS];
    if (fromDate || toDate) {
      events = events.filter((e) => {
        const start = new Date(e.starts_at);
        if (fromDate && start < new Date(fromDate)) return false;
        if (toDate && start > new Date(toDate)) return false;
        return true;
      });
    }
    if (category) {
      events = events.filter((e) => e.category === category);
    }
    return { data: events, error: null };
  }

  try {
    // ── Supabase: use RPC for geo queries, or standard query ──
    if (lat && lng && radiusKm) {
      const { data, error } = await supabase.rpc('get_nearby_events', {
        lat,
        lng,
        radius_km: radiusKm,
        category_filter: category,
        from_date: fromDate || new Date().toISOString(),
        to_date: toDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      });
      if (error) throw error;
      return { data: data || [], error: null };
    }

    let query = supabase
      .from('events_with_creator')
      .select('*')
      .order('starts_at', { ascending: true });

    if (fromDate) query = query.gte('starts_at', fromDate);
    if (toDate) query = query.lte('starts_at', toDate);
    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    console.error('[eventService] fetchEvents error:', err.message);
    return { data: [], error: err.message };
  }
}

/**
 * Fetch a single event by ID.
 */
export async function fetchEventById(eventId) {
  if (!IS_SUPABASE_CONFIGURED) {
    const event = MOCK_EVENTS.find((e) => e.id === eventId) || null;
    return { data: event, error: event ? null : 'Event not found' };
  }

  try {
    const { data, error } = await supabase
      .from('events_with_creator')
      .select('*')
      .eq('id', eventId)
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Fetch events created by a specific user.
 */
export async function fetchMyEvents(userId) {
  if (!IS_SUPABASE_CONFIGURED) {
    return { data: MOCK_EVENTS.filter((e) => e.creator_name === 'You'), error: null };
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err.message };
  }
}

// ───────────────────────────────────
// CREATE / UPDATE / DELETE
// ───────────────────────────────────

/**
 * Create a new event.
 */
export async function createEvent(eventData) {
  if (!IS_SUPABASE_CONFIGURED) {
    // Mock: return a fake ID
    const mockEvent = {
      ...eventData,
      id: 'mock-' + Date.now(),
      save_count: 0,
      share_count: 0,
      avg_rating: null,
      rating_count: 0,
      created_at: new Date().toISOString(),
    };
    console.log('[eventService] Mock create:', mockEvent.id);
    return { data: mockEvent, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .insert({
        creator_id: eventData.creator_id,
        title: eventData.title,
        description: eventData.description,
        category: eventData.category,
        event_mode: eventData.event_mode,
        venue_name: eventData.venue_name,
        address_text: eventData.address_text,
        latitude: eventData.latitude,
        longitude: eventData.longitude,
        online_link: eventData.online_link,
        online_platform: eventData.online_platform,
        online_instructions: eventData.online_instructions,
        starts_at: eventData.starts_at,
        ends_at: eventData.ends_at,
        price_text: eventData.price_text || 'Free',
        cover_image_url: eventData.cover_image_url,
        is_recurring: eventData.is_recurring || false,
        rrule: eventData.rrule,
        recurrence_end: eventData.recurrence_end,
      })
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Update an existing event.
 */
export async function updateEvent(eventId, updates) {
  if (!IS_SUPABASE_CONFIGURED) {
    console.log('[eventService] Mock update:', eventId);
    return { data: { id: eventId, ...updates }, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Soft-delete (cancel) an event.
 */
export async function cancelEvent(eventId) {
  return updateEvent(eventId, { status: 'cancelled' });
}

// ───────────────────────────────────
// INTERACTIONS
// ───────────────────────────────────

/**
 * Save / unsave an event.
 */
export async function toggleSaveEvent(userId, eventId, isSaved) {
  if (!IS_SUPABASE_CONFIGURED) {
    console.log('[eventService] Mock toggle save:', eventId, !isSaved);
    return { error: null };
  }

  try {
    if (isSaved) {
      const { error } = await supabase
        .from('saved_events')
        .delete()
        .match({ user_id: userId, event_id: eventId });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('saved_events')
        .insert({ user_id: userId, event_id: eventId });
      if (error) throw error;
    }
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Get user's saved event IDs.
 */
export async function fetchSavedEventIds(userId) {
  if (!IS_SUPABASE_CONFIGURED) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('saved_events')
      .select('event_id')
      .eq('user_id', userId);
    if (error) throw error;
    return { data: (data || []).map((r) => r.event_id), error: null };
  } catch (err) {
    return { data: [], error: err.message };
  }
}

/**
 * Submit or update a rating.
 */
export async function submitRating(userId, eventId, stars) {
  if (!IS_SUPABASE_CONFIGURED) {
    console.log('[eventService] Mock rating:', eventId, stars);
    return { error: null };
  }

  try {
    const { error } = await supabase
      .from('ratings')
      .upsert({ user_id: userId, event_id: eventId, stars }, { onConflict: 'user_id,event_id' });
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Log a share.
 */
export async function logShare(userId, eventId) {
  if (!IS_SUPABASE_CONFIGURED) {
    console.log('[eventService] Mock share:', eventId);
    return { error: null };
  }

  try {
    const { error } = await supabase
      .from('shares')
      .insert({ user_id: userId, event_id: eventId });
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Submit an event report.
 */
export async function reportEvent(userId, eventId, reason = 'other', details = null) {
  if (!IS_SUPABASE_CONFIGURED) {
    console.log('[eventService] Mock report:', eventId, reason);
    return { error: null };
  }

  try {
    const { error } = await supabase
      .from('reports')
      .insert({ user_id: userId, event_id: eventId, reason, details });
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}
