import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActionSheetIOS,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '../constants/theme';

/**
 * ImagePickerButton — tappable zone for selecting an event cover image.
 *
 * Props:
 *   imageUri    — current image URI (null if none)
 *   onImageSelected(uri) — callback with local file URI
 *   onImageRemoved()     — callback when user removes image
 */
export default function ImagePickerButton({ imageUri, onImageSelected, onImageRemoved }) {
  const [loading, setLoading] = useState(false);

  const requestPermission = useCallback(async (type) => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }, []);

  const launchPicker = useCallback(async (source) => {
    const granted = await requestPermission(source);
    if (!granted) {
      Alert.alert(
        'Permission needed',
        `Please allow access to your ${source === 'camera' ? 'camera' : 'photo library'} in Settings.`,
      );
      return;
    }

    setLoading(true);
    try {
      const options = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      };

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets?.[0]) {
        onImageSelected?.(result.assets[0].uri);
      }
    } catch (err) {
      console.error('[ImagePickerButton] Error:', err);
      Alert.alert('Error', 'Could not select image. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [requestPermission, onImageSelected]);

  const handlePress = useCallback(() => {
    if (imageUri) {
      // Show options to change or remove
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Take Photo', 'Choose from Library', 'Remove Image'],
            cancelButtonIndex: 0,
            destructiveButtonIndex: 3,
          },
          (index) => {
            if (index === 1) launchPicker('camera');
            else if (index === 2) launchPicker('library');
            else if (index === 3) onImageRemoved?.();
          },
        );
      } else {
        Alert.alert('Cover Image', 'Change or remove the cover image?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => launchPicker('camera') },
          { text: 'Choose from Library', onPress: () => launchPicker('library') },
          { text: 'Remove', style: 'destructive', onPress: () => onImageRemoved?.() },
        ]);
      }
    } else {
      // Show camera vs library choice
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Take Photo', 'Choose from Library'],
            cancelButtonIndex: 0,
          },
          (index) => {
            if (index === 1) launchPicker('camera');
            else if (index === 2) launchPicker('library');
          },
        );
      } else {
        Alert.alert('Add Cover Image', 'Choose a source', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => launchPicker('camera') },
          { text: 'Choose from Library', onPress: () => launchPicker('library') },
        ]);
      }
    }
  }, [imageUri, launchPicker, onImageRemoved]);

  if (imageUri) {
    return (
      <TouchableOpacity style={styles.imageContainer} onPress={handlePress}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        <View style={styles.imageOverlay}>
          <View style={styles.changeBtn}>
            <Ionicons name="camera" size={16} color="#fff" />
            <Text style={styles.changeBtnText}>Change</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.placeholder} onPress={handlePress} disabled={loading}>
      <Ionicons
        name={loading ? 'hourglass-outline' : 'camera-outline'}
        size={32}
        color={COLORS.textTertiary}
      />
      <Text style={styles.placeholderTitle}>Add Cover Image</Text>
      <Text style={styles.placeholderSubtitle}>
        Tap to take a photo or choose from library
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  placeholderTitle: {
    fontSize: FONT.sizes.md,
    color: COLORS.textSecondary,
    ...FONT.medium,
    marginTop: SPACING.xs,
  },
  placeholderSubtitle: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xxl,
  },

  imageContainer: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.lg,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    alignItems: 'flex-end',
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  changeBtnText: {
    fontSize: FONT.sizes.sm,
    color: '#fff',
    ...FONT.medium,
  },
});
