import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { TORONTO_CENTER, COLORS, CATEGORY_CONFIG } from '../../constants/theme';

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

// Create a custom pin icon for a given category color
function createPinIcon(color, isSelected) {
  const size = isSelected ? 32 : 24;
  const svg = `
    <svg width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" stroke="white" stroke-width="2.5"/>
      <polygon points="${size / 2 - 4},${size - 2} ${size / 2 + 4},${size - 2} ${size / 2},${size + 6}" fill="${color}"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-map-pin',
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 8)],
  });
}

// Component that handles map view changes from parent
function MapController({ selectedEventId, events }) {
  const map = useMap();

  useEffect(() => {
    if (selectedEventId) {
      const event = events.find((e) => e.id === selectedEventId);
      if (event?.latitude && event?.longitude) {
        map.flyTo([event.latitude, event.longitude], 15, { duration: 0.35 });
      }
    }
  }, [selectedEventId, events, map]);

  return null;
}

export default function EventMap({
  events,
  selectedEventId,
  onSelectEvent,
  onDeselectEvent,
  onRegionChange,
  style,
}) {
  const [mapReady, setMapReady] = useState(false);

  // Filter to only in-person / hybrid events that have coordinates
  const mappableEvents = events.filter(
    (e) => e.latitude != null && e.longitude != null && e.event_mode !== 'online',
  );

  const handleMapClick = useCallback(() => {
    onDeselectEvent?.();
  }, [onDeselectEvent]);

  return (
    <View style={[styles.container, style]}>
      <MapContainer
        center={[TORONTO_CENTER.latitude, TORONTO_CENTER.longitude]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        whenReady={() => setMapReady(true)}
        onClick={handleMapClick}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        <MapController selectedEventId={selectedEventId} events={events} />
        {mappableEvents.map((event) => {
          const cat = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.other;
          const isSelected = selectedEventId === event.id;
          return (
            <Marker
              key={event.id}
              position={[event.latitude, event.longitude]}
              icon={createPinIcon(cat.color, isSelected)}
              eventHandlers={{
                click: () => onSelectEvent?.(event.id),
              }}
            >
              {isSelected && (
                <Popup>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{event.title}</span>
                </Popup>
              )}
            </Marker>
          );
        })}
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
