export const COLORS = {
  // Primary palette — clean, map-friendly
  primary: '#007AFF',       // iOS blue accent
  primaryLight: '#E3F2FD',
  primaryDark: '#0055CC',

  // Neutrals
  background: '#FFFFFF',
  surface: '#F8F9FA',
  card: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#F0F1F3',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Semantic
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5AC8FA',

  // Category colors
  music: '#AF52DE',
  food: '#FF9500',
  sports: '#34C759',
  art: '#FF2D55',
  community: '#5AC8FA',
  nightlife: '#BF5AF2',
  tech: '#007AFF',
  wellness: '#30D158',
  other: '#8E8E93',

  // Map
  mapPin: '#FF3B30',
  mapPinSelected: '#007AFF',
  mapOverlay: 'rgba(0,0,0,0.03)',

  // Drawer
  drawerHandle: '#D1D5DB',
  drawerBackground: '#FFFFFF',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

export const FONT = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    title: 28,
  },
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

// Toronto default center
export const TORONTO_CENTER = {
  latitude: 43.6532,
  longitude: -79.3832,
};

export const CATEGORY_CONFIG = {
  music:     { label: 'Music',     color: COLORS.music,     icon: 'musical-notes' },
  food:      { label: 'Food',      color: COLORS.food,      icon: 'restaurant' },
  sports:    { label: 'Sports',    color: COLORS.sports,    icon: 'football' },
  art:       { label: 'Art',       color: COLORS.art,       icon: 'color-palette' },
  community: { label: 'Community', color: COLORS.community, icon: 'people' },
  nightlife: { label: 'Nightlife', color: COLORS.nightlife, icon: 'moon' },
  tech:      { label: 'Tech',      color: COLORS.tech,      icon: 'laptop' },
  wellness:  { label: 'Wellness',  color: COLORS.wellness,  icon: 'leaf' },
  other:     { label: 'Other',     color: COLORS.other,     icon: 'ellipsis-horizontal' },
};
