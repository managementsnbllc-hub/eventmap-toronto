// ─── Filter & Sort Engine ───
// All filtering and sorting logic for events.
// Operates on the mock dataset now; same interface works with API results later.

import { TORONTO_CENTER } from '../constants/theme';

// ── Default filter state ──
export const DEFAULT_FILTERS = {
  timeRange: 'this_week',     // 'today' | 'tomorrow' | 'weekend' | 'this_week' | 'custom'
  customDateStart: null,       // Date object, only used when timeRange === 'custom'
  customDateEnd: null,
  categories: [],              // empty = all categories
  eventMode: 'all',            // 'all' | 'in_person' | 'online'
  priceType: 'all',            // 'all' | 'free' | 'paid'
  maxDistance: null,            // km number or null (no limit)
  sortBy: 'smart',             // 'smart' | 'date' | 'distance' | 'rating' | 'popularity'
  searchQuery: '',             // keyword search across title, venue, description
};

// ── Sort options for the UI ──
export const SORT_OPTIONS = [
  { key: 'smart',      label: 'Smart sort',     icon: 'sparkles' },
  { key: 'date',       label: 'Soonest first',  icon: 'time-outline' },
  { key: 'distance',   label: 'Nearest first',  icon: 'navigate-outline' },
  { key: 'rating',     label: 'Top rated',       icon: 'star-outline' },
  { key: 'popularity', label: 'Most popular',    icon: 'trending-up-outline' },
];

// ── Distance filter presets ──
export const DISTANCE_OPTIONS = [
  { key: null, label: 'Any distance' },
  { key: 1,    label: '1 km' },
  { key: 2,    label: '2 km' },
  { key: 5,    label: '5 km' },
  { key: 10,   label: '10 km' },
];

// ── Time range helpers ──

function getStartOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getThisWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: getStartOfDay(monday), end: getEndOfDay(sunday) };
}

function getTodayRange() {
  const now = new Date();
  return { start: getStartOfDay(now), end: getEndOfDay(now) };
}

function getTomorrowRange() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return { start: getStartOfDay(tomorrow), end: getEndOfDay(tomorrow) };
}

function getWeekendRange() {
  const now = new Date();
  const day = now.getDay();
  const satOffset = day === 0 ? -1 : 6 - day;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + satOffset);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  return { start: getStartOfDay(saturday), end: getEndOfDay(sunday) };
}

export function getTimeRange(filterKey, customStart, customEnd) {
  switch (filterKey) {
    case 'today':     return getTodayRange();
    case 'tomorrow':  return getTomorrowRange();
    case 'weekend':   return getWeekendRange();
    case 'this_week': return getThisWeekRange();
    case 'custom':
      return {
        start: customStart ? getStartOfDay(customStart) : getStartOfDay(new Date()),
        end: customEnd ? getEndOfDay(customEnd) : getEndOfDay(new Date()),
      };
    default: return getThisWeekRange();
  }
}

// ── Distance calculation (Haversine) ──

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getEventDistance(event, userLat, userLon) {
  if (!event.latitude || !event.longitude) return null;
  return haversineKm(userLat || TORONTO_CENTER.latitude, userLon || TORONTO_CENTER.longitude,
    event.latitude, event.longitude);
}

// ── Price parsing helper ──

function isFreeEvent(event) {
  if (!event.price_text) return true;
  const lower = event.price_text.toLowerCase();
  return lower.includes('free') || lower === '$0';
}

// ── Search matching ──

function matchesSearch(event, query) {
  if (!query || query.trim().length === 0) return true;
  const q = query.toLowerCase().trim();
  const searchable = [
    event.title,
    event.venue_name,
    event.description,
    event.address_text,
    event.category,
  ].filter(Boolean).join(' ').toLowerCase();
  // Match all words (AND logic)
  const words = q.split(/\s+/);
  return words.every((w) => searchable.includes(w));
}

// ── Main filter function ──

export function filterEvents(events, filters, userLat, userLon) {
  const {
    timeRange, customDateStart, customDateEnd,
    categories, eventMode, priceType,
    maxDistance, searchQuery,
  } = filters;

  const { start: rangeStart, end: rangeEnd } = getTimeRange(timeRange, customDateStart, customDateEnd);

  return events.filter((event) => {
    // 1. Time range
    const eventStart = new Date(event.starts_at);
    if (eventStart < rangeStart || eventStart > rangeEnd) return false;

    // 2. Category
    if (categories.length > 0 && !categories.includes(event.category)) return false;

    // 3. Event mode
    if (eventMode === 'in_person' && event.event_mode === 'online') return false;
    if (eventMode === 'online' && event.event_mode === 'in_person') return false;

    // 4. Price
    if (priceType === 'free' && !isFreeEvent(event)) return false;
    if (priceType === 'paid' && isFreeEvent(event)) return false;

    // 5. Distance (only applies to in-person events)
    if (maxDistance && event.latitude && event.longitude) {
      const dist = getEventDistance(event, userLat, userLon);
      if (dist > maxDistance) return false;
    }

    // 6. Search query
    if (!matchesSearch(event, searchQuery)) return false;

    return true;
  });
}

// ── Sort function ──

export function sortEvents(events, sortBy, userLat, userLon) {
  const sorted = [...events];

  switch (sortBy) {
    case 'date':
      return sorted.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));

    case 'distance':
      return sorted.sort((a, b) => {
        const dA = getEventDistance(a, userLat, userLon);
        const dB = getEventDistance(b, userLat, userLon);
        if (dA === null && dB === null) return 0;
        if (dA === null) return 1;
        if (dB === null) return -1;
        return dA - dB;
      });

    case 'rating':
      return sorted.sort((a, b) => {
        const rA = a.avg_rating || 0;
        const rB = b.avg_rating || 0;
        if (rB !== rA) return rB - rA;
        return (b.rating_count || 0) - (a.rating_count || 0);
      });

    case 'popularity':
      return sorted.sort((a, b) => {
        const popA = (a.save_count || 0) + (a.share_count || 0);
        const popB = (b.save_count || 0) + (b.share_count || 0);
        return popB - popA;
      });

    case 'smart':
    default:
      // Smart sort: balanced score of soonness, distance, rating, popularity
      return sorted.sort((a, b) => {
        const scoreA = smartScore(a, userLat, userLon);
        const scoreB = smartScore(b, userLat, userLon);
        return scoreB - scoreA;
      });
  }
}

function smartScore(event, userLat, userLon) {
  // Soonness: events starting sooner score higher (max 30 pts)
  const hoursUntil = (new Date(event.starts_at) - Date.now()) / (1000 * 60 * 60);
  const soonScore = Math.max(0, 30 - hoursUntil * 0.2);

  // Distance: closer scores higher (max 25 pts)
  const dist = getEventDistance(event, userLat, userLon);
  const distScore = dist !== null ? Math.max(0, 25 - dist * 3) : 10;

  // Rating (max 20 pts)
  const ratingScore = (event.avg_rating || 0) * 4;

  // Popularity (max 25 pts)
  const pop = (event.save_count || 0) + (event.share_count || 0);
  const popScore = Math.min(25, pop * 0.1);

  return soonScore + distScore + ratingScore + popScore;
}

// ── Filter summary (for badge / subtitle) ──

export function getActiveFilterCount(filters) {
  let count = 0;
  if (filters.categories.length > 0) count++;
  if (filters.eventMode !== 'all') count++;
  if (filters.priceType !== 'all') count++;
  if (filters.maxDistance !== null) count++;
  if (filters.sortBy !== 'smart') count++;
  return count;
}

export function getFilterSummary(filters) {
  const parts = [];
  if (filters.categories.length > 0) {
    parts.push(`${filters.categories.length} categor${filters.categories.length === 1 ? 'y' : 'ies'}`);
  }
  if (filters.eventMode !== 'all') {
    parts.push(filters.eventMode === 'in_person' ? 'In-person' : 'Online');
  }
  if (filters.priceType !== 'all') {
    parts.push(filters.priceType === 'free' ? 'Free' : 'Paid');
  }
  if (filters.maxDistance) {
    parts.push(`Within ${filters.maxDistance} km`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}
