// Clean, minimal map style for Google Maps (Android only).
// On iOS we use Apple Maps natively which already has the clean look.
// This strips noise: hides transit, tones down labels, softens road colors.

export const CLEAN_MAP_STYLE = [
  // ── Base geometry ──
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ saturation: -20 }],
  },

  // ── Water: soft blue ──
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#D6EAF8' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#7FB3D8' }],
  },

  // ── Land / landscape ──
  {
    featureType: 'landscape',
    elementType: 'geometry.fill',
    stylers: [{ color: '#F5F5F5' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry.fill',
    stylers: [{ color: '#F0F4F0' }],
  },

  // ── Parks: subtle green ──
  {
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [{ color: '#DFF0D8' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6B9B5E' }],
  },

  // ── Hide most POIs (we show our own pins) ──
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels',
    stylers: [{ visibility: 'simplified' }],
  },
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }],
  },

  // ── Roads: light grey, minimal labels ──
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#FFFFFF' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#E8E8E8' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#F5D89A' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#E8C86E' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#999999' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels',
    stylers: [{ visibility: 'simplified' }],
  },

  // ── Transit: hide ──
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },

  // ── Administrative labels: subtle ──
  {
    featureType: 'administrative',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#AAAAAA' }],
  },
  {
    featureType: 'administrative.neighborhood',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#B0B0B0' }, { visibility: 'simplified' }],
  },

  // ── Buildings: very light ──
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ECECEC' }],
  },
];
