import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, CATEGORY_CONFIG } from '../../constants/theme';

export default function EventPin({ event, isSelected }) {
  const cat = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.other;

  if (isSelected) {
    return (
      <View style={styles.selectedContainer}>
        <View style={[styles.selectedBubble, { backgroundColor: cat.color }]}>
          <Ionicons name={cat.icon} size={14} color="#FFFFFF" />
          <Text style={styles.selectedTitle} numberOfLines={1}>
            {event.title}
          </Text>
        </View>
        <View style={[styles.selectedArrow, { borderTopColor: cat.color }]} />
      </View>
    );
  }

  return (
    <View style={styles.pinContainer}>
      <View style={[styles.pinDot, { backgroundColor: cat.color }]}>
        <Ionicons name={cat.icon} size={12} color="#FFFFFF" />
      </View>
      <View style={[styles.pinStem, { backgroundColor: cat.color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Default pin ──
  pinContainer: {
    alignItems: 'center',
    width: 30,
    height: 38,
  },
  pinDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  pinStem: {
    width: 3,
    height: 8,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginTop: -1,
  },

  // ── Selected pin (expanded bubble) ──
  selectedContainer: {
    alignItems: 'center',
    minWidth: 80,
    maxWidth: 180,
  },
  selectedBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.lg,
    gap: 6,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: { elevation: 6 },
    }),
  },
  selectedTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 130,
  },
  selectedArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
