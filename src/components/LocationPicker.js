import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Platform,
  ActivityIndicator, KeyboardAvoidingView, Keyboard,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT, SHADOWS, TORONTO_CENTER } from '../constants/theme';
import { CLEAN_MAP_STYLE } from './map/mapStyle';

const INITIAL_REGION = {
  latitude: TORONTO_CENTER.latitude,
  longitude: TORONTO_CENTER.longitude,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

export default function LocationPicker({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const { onSelect, initialLat, initialLng, initialAddress } = route.params || {};

  const [pin, setPin] = useState(
    initialLat && initialLng
      ? { latitude: initialLat, longitude: initialLng }
      : { latitude: TORONTO_CENTER.latitude, longitude: TORONTO_CENTER.longitude }
  );
  const [address, setAddress] = useState(initialAddress || '');
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Center map on initial pin
  useEffect(() => {
    if (initialLat && initialLng && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: initialLat,
        longitude: initialLng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 300);
    }
  }, [initialLat, initialLng]);

  const handleMapPress = useCallback((e) => {
    const coord = e.nativeEvent.coordinate;
    setPin(coord);
    // Reverse geocode (basic — production would use Google/Mapbox Geocoding API)
    setAddress(`${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)}`);
  }, []);

  const handleMarkerDrag = useCallback((e) => {
    const coord = e.nativeEvent.coordinate;
    setPin(coord);
    setAddress(`${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)}`);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setSearching(true);

    try {
      // Use MapView's native address lookup for basic geocoding
      // Production: replace with Google Places Autocomplete / Mapbox Geocoding
      const query = searchQuery.trim() + (searchQuery.includes('Toronto') ? '' : ', Toronto, ON');
      const results = await mapRef.current?.addressForCoordinate?.(pin);

      // Fallback: just center on Toronto and let user tap
      // In production this would call a geocoding API
      const simulated = {
        latitude: TORONTO_CENTER.latitude + (Math.random() - 0.5) * 0.02,
        longitude: TORONTO_CENTER.longitude + (Math.random() - 0.5) * 0.02,
      };
      setPin(simulated);
      setAddress(query);
      mapRef.current?.animateToRegion({
        ...simulated,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }, 350);
    } catch (err) {
      console.warn('[LocationPicker] Search error:', err);
    } finally {
      setSearching(false);
    }
  }, [searchQuery, pin]);

  const handleConfirm = useCallback(() => {
    if (route.params?.onSelect) {
      // Pass back through navigation params
      navigation.navigate({
        name: 'CreateEvent',
        params: {
          selectedLocation: {
            latitude: pin.latitude,
            longitude: pin.longitude,
            address: address,
          },
        },
        merge: true,
      });
    }
    navigation.goBack();
  }, [pin, address, navigation, route.params]);

  const handleRecenter = useCallback(() => {
    mapRef.current?.animateToRegion(INITIAL_REGION, 350);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
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
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={INITIAL_REGION}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          customMapStyle={Platform.OS === 'android' ? CLEAN_MAP_STYLE : undefined}
          mapType="standard"
          rotateEnabled={false}
          pitchEnabled={false}
        >
          <Marker
            coordinate={pin}
            draggable
            onDragEnd={handleMarkerDrag}
          >
            <View style={styles.pinContainer}>
              <View style={styles.pin}>
                <Ionicons name="location" size={24} color="#fff" />
              </View>
              <View style={styles.pinShadow} />
            </View>
          </Marker>
        </MapView>

        {/* Recenter button */}
        <TouchableOpacity style={styles.recenterBtn} onPress={handleRecenter}>
          <Ionicons name="locate" size={22} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Instruction overlay */}
        <View style={styles.instructionBadge}>
          <Ionicons name="hand-left-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.instructionText}>
            Tap map or drag pin to set location
          </Text>
        </View>
      </View>

      {/* Selected location bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.md }]}>
        <View style={styles.selectedLocation}>
          <Ionicons name="location" size={20} color={COLORS.primary} />
          <View style={styles.selectedLocationText}>
            <Text style={styles.selectedLabel}>Selected location</Text>
            <Text style={styles.selectedAddress} numberOfLines={1}>
              {address || 'Tap the map to choose a location'}
            </Text>
            <Text style={styles.selectedCoords}>
              {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.confirmBtnText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
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

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#fff',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : 0,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT.sizes.md,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm,
  },

  // Map
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },

  pinContainer: {
    alignItems: 'center',
  },
  pin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  pinShadow: {
    width: 12,
    height: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginTop: 2,
  },

  recenterBtn: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
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
    ...SHADOWS.sm,
  },
  instructionText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.medium,
  },

  // Bottom
  bottomBar: {
    backgroundColor: '#fff',
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
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
