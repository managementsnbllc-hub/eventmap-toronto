import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT, SHADOWS, TORONTO_CENTER } from '../constants/theme';

// Inject Leaflet CSS once
if (typeof document !== 'undefined') {
  const id = 'leaflet-css';
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
}

const PIN_ICON = L.divIcon({
  html: `<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="14" fill="${COLORS.primary}" stroke="white" stroke-width="2.5"/>
    <polygon points="12,28 20,28 16,38" fill="${COLORS.primary}"/>
    <text x="16" y="20" text-anchor="middle" fill="white" font-size="16">&#x1F4CD;</text>
  </svg>`,
  className: 'location-pin',
  iconSize: [32, 40],
  iconAnchor: [16, 40],
});

// Handle map click events
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Fly to a location
function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 0.35 });
    }
  }, [position, map]);
  return null;
}

export default function LocationPicker({ navigation, route }) {
  const { onSelect, initialLat, initialLng, initialAddress } = route.params || {};

  const [pin, setPin] = useState(
    initialLat && initialLng
      ? { lat: initialLat, lng: initialLng }
      : { lat: TORONTO_CENTER.latitude, lng: TORONTO_CENTER.longitude }
  );
  const [address, setAddress] = useState(initialAddress || '');
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [flyTarget, setFlyTarget] = useState(null);

  const handleMapClick = useCallback((latlng) => {
    setPin({ lat: latlng.lat, lng: latlng.lng });
    setAddress(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      // Use Nominatim (free geocoding) for web
      const query = searchQuery.trim() + (searchQuery.includes('Toronto') ? '' : ', Toronto, ON');
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        const loc = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setPin(loc);
        setAddress(data[0].display_name);
        setFlyTarget([loc.lat, loc.lng]);
      }
    } catch (err) {
      console.warn('[LocationPicker] Search error:', err);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handleConfirm = useCallback(() => {
    if (route.params?.onSelect) {
      navigation.navigate({
        name: 'CreateEvent',
        params: {
          selectedLocation: {
            latitude: pin.lat,
            longitude: pin.lng,
            address: address,
          },
        },
        merge: true,
      });
    }
    navigation.goBack();
  }, [pin, address, navigation, route.params]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pick Location</Text>
        <TouchableOpacity onPress={handleConfirm} style={styles.headerBtn}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search address or place..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searching ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapContainer
          center={[pin.lat, pin.lng]}
          zoom={14}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {flyTarget && <FlyTo position={flyTarget} />}
          <Marker position={[pin.lat, pin.lng]} icon={PIN_ICON} />
        </MapContainer>

        {/* Instruction overlay */}
        <View style={styles.instructionBadge}>
          <Ionicons name="hand-left-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.instructionText}>Click map to set location</Text>
        </View>
      </View>

      {/* Selected location bar */}
      <View style={styles.bottomBar}>
        <View style={styles.selectedLocation}>
          <Ionicons name="location" size={20} color={COLORS.primary} />
          <View style={styles.selectedLocationText}>
            <Text style={styles.selectedLabel}>Selected location</Text>
            <Text style={styles.selectedAddress} numberOfLines={1}>
              {address || 'Click the map to choose a location'}
            </Text>
            <Text style={styles.selectedCoords}>
              {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.confirmBtnText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT.sizes.lg,
    color: COLORS.textPrimary,
    ...FONT.semibold,
  },
  doneText: {
    fontSize: FONT.sizes.md,
    color: COLORS.primary,
    ...FONT.semibold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#fff',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT.sizes.md,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm,
    outlineStyle: 'none',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  instructionBadge: {
    position: 'absolute',
    top: SPACING.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    zIndex: 1000,
    ...SHADOWS.sm,
  },
  instructionText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.medium,
  },
  bottomBar: {
    backgroundColor: '#fff',
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SPACING.lg,
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  selectedLocationText: {
    flex: 1,
  },
  selectedLabel: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    ...FONT.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  selectedAddress: {
    fontSize: FONT.sizes.md,
    color: COLORS.textPrimary,
    ...FONT.medium,
  },
  selectedCoords: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  confirmBtnText: {
    fontSize: FONT.sizes.md,
    color: '#fff',
    ...FONT.semibold,
  },
});
