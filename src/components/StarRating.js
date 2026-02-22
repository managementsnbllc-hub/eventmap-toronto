import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';

export default function StarRating({ rating, size = 24, interactive = false, onRate }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.container}>
      {stars.map((star) => {
        const filled = rating >= star;
        const halfFilled = !filled && rating >= star - 0.5;
        const iconName = filled ? 'star' : halfFilled ? 'star-half' : 'star-outline';
        const color = filled || halfFilled ? COLORS.warning : COLORS.border;

        if (interactive) {
          return (
            <TouchableOpacity
              key={star}
              onPress={() => onRate?.(star)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Ionicons name={iconName} size={size} color={color} />
            </TouchableOpacity>
          );
        }

        return <Ionicons key={star} name={iconName} size={size} color={color} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
  },
});
