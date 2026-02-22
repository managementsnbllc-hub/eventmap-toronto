import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform,
  KeyboardAvoidingView, ScrollView, Image, ActionSheetIOS,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT, SHADOWS } from '../constants/theme';
import { useAuth } from '../state/AuthContext';
import { updateProfile } from '../services/authService';

export default function EditProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [avatarUri, setAvatarUri] = useState(user?.avatar_url || null);
  const [saving, setSaving] = useState(false);

  const hasChanges = displayName.trim() !== (user?.display_name || '') || avatarUri !== (user?.avatar_url || null);

  const handlePickAvatar = useCallback(async (source) => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      Alert.alert('Permission needed', `Allow access to your ${source} in Settings.`);
      return;
    }

    const options = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets?.[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }, []);

  const showAvatarOptions = useCallback(() => {
    const options = avatarUri
      ? ['Cancel', 'Take Photo', 'Choose from Library', 'Remove Photo']
      : ['Cancel', 'Take Photo', 'Choose from Library'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 0, destructiveButtonIndex: avatarUri ? 3 : undefined },
        (index) => {
          if (index === 1) handlePickAvatar('camera');
          else if (index === 2) handlePickAvatar('library');
          else if (index === 3 && avatarUri) setAvatarUri(null);
        },
      );
    } else {
      const alertOptions = [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => handlePickAvatar('camera') },
        { text: 'Choose from Library', onPress: () => handlePickAvatar('library') },
      ];
      if (avatarUri) {
        alertOptions.push({
          text: 'Remove Photo', style: 'destructive', onPress: () => setAvatarUri(null),
        });
      }
      Alert.alert('Profile Photo', 'Change your photo', alertOptions);
    }
  }, [avatarUri, handlePickAvatar]);

  const handleSave = useCallback(async () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter a display name.');
      return;
    }

    setSaving(true);
    try {
      // In production: upload avatar to Supabase Storage, then save URL
      const updates = {
        display_name: trimmed,
        avatar_url: avatarUri, // local URI for now; production would be a remote URL
      };
      const { error } = await updateProfile(user?.id, updates);
      if (error) {
        Alert.alert('Error', error);
        return;
      }
      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [displayName, avatarUri, user, navigation]);

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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerBtn}
          disabled={!hasChanges || saving}
        >
          <Text style={[
            styles.saveText,
            (!hasChanges || saving) && styles.saveTextDisabled,
          ]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <TouchableOpacity style={styles.avatarSection} onPress={showAvatarOptions}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={44} color={COLORS.textTertiary} />
            </View>
          )}
          <View style={styles.avatarBadge}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={showAvatarOptions}>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>

        {/* Display name */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Display Name</Text>
          <TextInput
            style={styles.fieldInput}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={COLORS.textTertiary}
            maxLength={50}
            autoCapitalize="words"
          />
          <Text style={styles.charCount}>{displayName.length}/50</Text>
        </View>

        {/* Phone (read-only) */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Phone</Text>
          <View style={styles.readOnlyField}>
            <Ionicons name="checkmark-circle" size={18} color="#34C759" />
            <Text style={styles.readOnlyText}>{user?.phone || 'Not set'}</Text>
            <Text style={styles.verifiedBadge}>Verified</Text>
          </View>
          <Text style={styles.fieldHint}>Phone number cannot be changed</Text>
        </View>

        {/* Member since */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Member Since</Text>
          <Text style={styles.readOnlyValue}>
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString('en-CA', {
                  year: 'numeric', month: 'long',
                })
              : 'Unknown'
            }
          </Text>
        </View>
      </ScrollView>
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
  saveText: {
    fontSize: FONT.sizes.md,
    color: COLORS.primary,
    ...FONT.semibold,
  },
  saveTextDisabled: {
    color: COLORS.textTertiary,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    paddingBottom: 100,
  },

  // Avatar
  avatarSection: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  changePhotoText: {
    fontSize: FONT.sizes.md,
    color: COLORS.primary,
    ...FONT.semibold,
    marginBottom: SPACING.xxl,
  },

  // Fields
  field: {
    width: '100%',
    marginBottom: SPACING.xxl,
  },
  fieldLabel: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.semibold,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT.sizes.md,
    color: COLORS.textPrimary,
  },
  charCount: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },

  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  readOnlyText: {
    flex: 1,
    fontSize: FONT.sizes.md,
    color: COLORS.textSecondary,
  },
  verifiedBadge: {
    fontSize: FONT.sizes.xs,
    color: '#34C759',
    ...FONT.semibold,
    backgroundColor: '#34C75915',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  fieldHint: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    marginTop: 4,
  },

  readOnlyValue: {
    fontSize: FONT.sizes.md,
    color: COLORS.textSecondary,
  },
});
