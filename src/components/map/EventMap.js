import React, { useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { TORONTO_CENTER, COLORS } from '../../constants/theme';
import { CLEAN_MAP_STYLE } from './mapStyle';
import EventPin from './EventPin';

// Toronto bounding region — shows the core city on open
const TORONTO_REGION = {
  latitude: TORONTO_CENTER.latitude,
  longitude: TORONTO_CENTER.longitude,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

export default function EventMap({
  events,
  selectedEventId,
  onSelectEvent,
  onDeselectEvent,
  onRegionChange,
  style,
}) {
  const mapRef = useRef(null);

  // When a pin is selected externally (e.g. from drawer), animate to it
  useEffect(() => {
    if (selectedEventId && mapRef.current) {
      const event = events.find((e) => e.id === selectedEventId);
      if (event?.latitude && event?.longitude) {
        mapRef.current.animateToRegion(
          {
            latitude: event.latitude,
            longitude: event.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          },
          350,
        );
      }
    }
  }, [selectedEventId, events]);

  const handleMarkerPress = useCallback(
    (event) => {
      onSelectEvent?.(event.id);
    },
    [onSelectEvent],
  );

  const handleMapPress = useCallback(() => {
    onDeselectEvent?.();
  }, [onDeselectEvent]);

  const handleRegionChangeComplete = useCallback(
    (region) => {
      onRegionChange?.(region);
    },
    [onRegionChange],
  );

  // Filter to only in-person / hybrid events that have coordinates
  const mappableEvents = events.filter(
    (e) => e.latitude != null && e.longitude != null && e.event_mode !== 'online',
  );

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={TORONTO_REGION}
        // iOS uses Apple Maps (clean by default), Android uses Google with custom style
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={Platform.OS === 'android' ? CLEAN_MAP_STYLE : undefined}
        // Map settings
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsTraffic={false}
        showsBuildings={false}
        showsIndoors={false}
        showsPointsOfInterest={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        // Events
        onPress={handleMapPress}
        onRegionChangeComplete={handleRegionChangeComplete}
        // iOS specific
        mapType="standard"
        userInterfaceStyle="light"
      >
        {mappableEvents.map((event) => (
          <Marker
            key={event.id}
            identifier={event.id}
            coordinate={{
              latitude: event.latitude,
              longitude: event.longitude,
            }}
            onPress={() => handleMarkerPress(event)}
            tracksViewChanges={selectedEventId === event.id}
            anchor={{ x: 0.5, y: 1 }}
          >
            <EventPin
              event={event}
              isSelected={selectedEventId === event.id}
            />
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
