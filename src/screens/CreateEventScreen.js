import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Platform, Alert, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT, CATEGORY_CONFIG, TORONTO_CENTER } from '../constants/theme';
import { useAuth } from '../state/AuthContext';
import PhoneVerifyModal from '../components/PhoneVerifyModal';
import RecurrencePicker from '../components/RecurrencePicker';
import ImagePickerButton from '../components/ImagePickerButton';
import { createEvent as createEventAPI, updateEvent as updateEventAPI } from '../services/eventService';
import { showToast } from '../components/Toast';

const CATEGORIES = Object.entries(CATEGORY_CONFIG).map(([key, val]) => ({ key, ...val }));

const MODE_OPTIONS = [
  { key: 'in_person', label: 'In-person', icon: 'location' },
  { key: 'online',    label: 'Online',    icon: 'videocam' },
  { key: 'hybrid',    label: 'Hybrid',    icon: 'git-merge-outline' },
];

const PLATFORM_OPTIONS = [
  { key: 'zoom',   label: 'Zoom' },
  { key: 'meet',   label: 'Google Meet' },
  { key: 'teams',  label: 'Teams' },
  { key: 'twitch', label: 'Twitch' },
  { key: 'other',  label: 'Other' },
];

function getDefaultStartDate() {
  const d = new Date();
  d.setHours(d.getHours() + 2);
  d.setMinutes(0, 0, 0);
  return d;
}

function getDefaultEndDate() {
  const d = getDefaultStartDate();
  d.setHours(d.getHours() + 2);
  return d;
}

export default function CreateEventScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { isVerified, user } = useAuth();
  const editEvent = route.params?.event || null;
  const isEdit = !!editEvent;

  // ── Phone verification gate ──
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // ── Form state ──
  const [title, setTitle] = useState(editEvent?.title || '');
  const [description, setDescription] = useState(editEvent?.description || '');
  const [category, setCategory] = useState(editEvent?.category || '');
  const [eventMode, setEventMode] = useState(editEvent?.event_mode || 'in_person');

  // Location
  const [venueName, setVenueName] = useState(editEvent?.venue_name || '');
  const [addressText, setAddressText] = useState(editEvent?.address_text || '');
  const [latitude, setLatitude] = useState(editEvent?.latitude || TORONTO_CENTER.latitude);
  const [longitude, setLongitude] = useState(editEvent?.longitude || TORONTO_CENTER.longitude);
  const [coverImageUri, setCoverImageUri] = useState(editEvent?.cover_image_url || null);

  // Online
  const [onlineLink, setOnlineLink] = useState(editEvent?.online_link || '');
  const [onlinePlatform, setOnlinePlatform] = useState(editEvent?.online_platform || '');
  const [onlineInstructions, setOnlineInstructions] = useState(editEvent?.online_instructions || '');

  // Date/time
  const [startDate, setStartDate] = useState(
    editEvent ? new Date(editEvent.starts_at) : getDefaultStartDate()
  );
  const [endDate, setEndDate] = useState(
    editEvent ? new Date(editEvent.ends_at) : getDefaultEndDate()
  );
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('date');

  // Price
  const [priceText, setPriceText] = useState(editEvent?.price_text || '');

  // Recurrence
  const [recurrence, setRecurrence] = useState({
    enabled: editEvent?.is_recurring || false,
    frequency: 'WEEKLY',
    days: [],
    endDate: (() => { const d = new Date(); d.setDate(d.getDate() + 90); return d; })(),
  });

  const showLocation = eventMode === 'in_person' || eventMode === 'hybrid';
  const showOnline = eventMode === 'online' || eventMode === 'hybrid';

  // ── Validation ──
  const errors = useMemo(() => {
    const e = {};
    if (!title.trim()) e.title = 'Title is required';
    if (title.length > 120) e.title = 'Title must be under 120 characters';
    if (!description.trim()) e.description = 'Description is required';
    if (!category) e.category = 'Choose a category';
    if (showLocation && !venueName.trim()) e.venueName = 'Venue name is required';
    if (showOnline && !onlineLink.trim()) e.onlineLink = 'Online link is required';
    if (endDate <= startDate) e.endDate = 'End time must be after start time';
    return e;
  }, [title, description, category, showLocation, venueName, showOnline, onlineLink, startDate, endDate]);

  const isValid = Object.keys(errors).length === 0;

  // ── Handlers ──

  const handlePublish = useCallback(async () => {
    if (!isVerified) {
      setShowVerifyModal(true);
      return;
    }
    if (!isValid) {
      const firstError = Object.values(errors)[0];
      Alert.alert('Missing info', firstError);
      return;
    }

    const eventData = {
      creator_id: user?.id || null,
      title: title.trim(),
      description: description.trim(),
      category,
      event_mode: eventMode,
      venue_name: showLocation ? venueName.trim() : null,
      address_text: showLocation ? addressText.trim() : null,
      latitude: showLocation ? latitude : null,
      longitude: showLocation ? longitude : null,
      online_link: showOnline ? onlineLink.trim() : null,
      online_platform: showOnline ? onlinePlatform || null : null,
      online_instructions: showOnline ? onlineInstructions.trim() : null,
      starts_at: startDate.toISOString(),
      ends_at: endDate.toISOString(),
      price_text: priceText.trim() || 'Free',
      cover_image_url: coverImageUri || null,
      is_recurring: recurrence.enabled,
      rrule: recurrence.enabled ? buildRRule(recurrence) : null,
      recurrence_end: recurrence.enabled ? recurrence.endDate.toISOString().split('T')[0] : null,
    };

    try {
      let result;
      if (isEdit) {
        result = await updateEventAPI(editEvent.id, eventData);
      } else {
        result = await createEventAPI(eventData);
      }

      if (result.error) {
        Alert.alert('Error', result.error);
        return;
      }

      Alert.alert(
        isEdit ? 'Event Updated' : 'Event Published!',
        `"${eventData.title}" has been ${isEdit ? 'updated' : 'published'} successfully.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    }
  }, [isVerified, isValid, errors, user, title, description, category, eventMode,
      venueName, addressText, latitude, longitude, onlineLink, onlinePlatform,
      onlineInstructions, startDate, endDate, priceText, coverImageUri, recurrence, editEvent,
      isEdit, navigation]);

  // ── Receive location from LocationPicker ──
  useEffect(() => {
    const loc = route.params?.selectedLocation;
    if (loc) {
      setLatitude(loc.latitude);
      setLongitude(loc.longitude);
      if (loc.address && !addressText) {
        setAddressText(loc.address);
      }
    }
  }, [route.params?.selectedLocation]);

  const handleVerified = useCallback(() => {
    setShowVerifyModal(false);
    // After verification, user can tap publish again
  }, []);

  // ── Date picker handlers ──
  const openStartDatePicker = useCallback(() => {
    setDatePickerMode('date');
    setShowStartPicker(true);
  }, []);

  const openStartTimePicker = useCallback(() => {
    setDatePickerMode('time');
    setShowStartPicker(true);
  }, []);

  const openEndTimePicker = useCallback(() => {
    setDatePickerMode('time');
    setShowEndPicker(true);
  }, []);

  const formatDate = (d) => d.toLocaleDateString('en-CA', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  const formatTime = (d) => d.toLocaleTimeString('en-CA', {
    hour: 'numeric', minute: '2-digit',
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Event' : 'New Event'}</Text>
        <TouchableOpacity
          onPress={handlePublish}
          style={[styles.publishBtn, !isValid && !isVerified && styles.publishBtnMuted]}
        >
          <Text style={styles.publishBtnText}>{isEdit ? 'Save' : 'Publish'}</Text>
        </TouchableOpacity>
      </View>

      {/* Verification banner */}
      {!isVerified && (
        <TouchableOpacity
          style={styles.verifyBanner}
          onPress={() => setShowVerifyModal(true)}
        >
          <Ionicons name="shield-checkmark" size={18} color={COLORS.warning} />
          <Text style={styles.verifyBannerText}>
            Phone verification required to publish
          </Text>
          <Text style={styles.verifyBannerLink}>Verify now</Text>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Title ── */}
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="What's happening?"
            placeholderTextColor={COLORS.textTertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />
          <Text style={styles.charCount}>{title.length}/120</Text>

          {/* ── Description ── */}
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea, errors.description && styles.inputError]}
            placeholder="Tell people about this event..."
            placeholderTextColor={COLORS.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={2000}
            textAlignVertical="top"
          />

          {/* ── Category ── */}
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const active = category === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryChip, active && { backgroundColor: cat.color + '20', borderColor: cat.color }]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Ionicons name={cat.icon} size={15} color={active ? cat.color : COLORS.textTertiary} />
                  <Text style={[styles.categoryChipText, active && { color: cat.color }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Event mode ── */}
          <Text style={styles.label}>Event type</Text>
          <View style={styles.modeRow}>
            {MODE_OPTIONS.map((opt) => {
              const active = eventMode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.modeChip, active && styles.modeChipActive]}
                  onPress={() => setEventMode(opt.key)}
                >
                  <Ionicons name={opt.icon} size={16} color={active ? COLORS.textInverse : COLORS.textSecondary} />
                  <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Location (in-person / hybrid) ── */}
          {showLocation && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionBlockTitle}>
                <Ionicons name="location" size={16} color={COLORS.success} /> Location
              </Text>
              <Text style={styles.label}>Venue name *</Text>
              <TextInput
                style={[styles.input, errors.venueName && styles.inputError]}
                placeholder="e.g. Trinity Bellwoods Park"
                placeholderTextColor={COLORS.textTertiary}
                value={venueName}
                onChangeText={setVenueName}
              />
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Street address"
                placeholderTextColor={COLORS.textTertiary}
                value={addressText}
                onChangeText={setAddressText}
              />
              <TouchableOpacity
                style={styles.pickOnMapBtn}
                onPress={() => navigation.navigate('LocationPicker', {
                  onSelect: true,
                  initialLat: latitude,
                  initialLng: longitude,
                  initialAddress: addressText,
                })}
              >
                <Ionicons name="map-outline" size={18} color={COLORS.primary} />
                <Text style={styles.pickOnMapText}>Pick on Map</Text>
                {latitude !== TORONTO_CENTER.latitude && (
                  <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ── Online details ── */}
          {showOnline && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionBlockTitle}>
                <Ionicons name="videocam" size={16} color={COLORS.info} /> Online Details
              </Text>
              <Text style={styles.label}>Meeting link *</Text>
              <TextInput
                style={[styles.input, errors.onlineLink && styles.inputError]}
                placeholder="https://zoom.us/j/..."
                placeholderTextColor={COLORS.textTertiary}
                value={onlineLink}
                onChangeText={setOnlineLink}
                keyboardType="url"
                autoCapitalize="none"
              />
              <Text style={styles.label}>Platform</Text>
              <View style={styles.platformRow}>
                {PLATFORM_OPTIONS.map((p) => {
                  const active = onlinePlatform === p.key;
                  return (
                    <TouchableOpacity
                      key={p.key}
                      style={[styles.platformChip, active && styles.platformChipActive]}
                      onPress={() => setOnlinePlatform(active ? '' : p.key)}
                    >
                      <Text style={[styles.platformChipText, active && styles.platformChipTextActive]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.label}>Join instructions (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Passcode, dial-in info, etc."
                placeholderTextColor={COLORS.textTertiary}
                value={onlineInstructions}
                onChangeText={setOnlineInstructions}
              />
            </View>
          )}

          {/* ── Date & Time ── */}
          <Text style={styles.label}>Date & Time</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity style={styles.dateBtn} onPress={openStartDatePicker}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
              <Text style={styles.dateBtnText}>{formatDate(startDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateBtn} onPress={openStartTimePicker}>
              <Ionicons name="time-outline" size={16} color={COLORS.primary} />
              <Text style={styles.dateBtnText}>{formatTime(startDate)}</Text>
            </TouchableOpacity>
            <Text style={styles.dateArrow}>→</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={openEndTimePicker}>
              <Ionicons name="time-outline" size={16} color={COLORS.primary} />
              <Text style={styles.dateBtnText}>{formatTime(endDate)}</Text>
            </TouchableOpacity>
          </View>
          {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}

          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode={datePickerMode}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(_, selected) => {
                if (Platform.OS === 'android') setShowStartPicker(false);
                if (selected) {
                  setStartDate(selected);
                  // Auto-adjust end date if needed
                  if (selected >= endDate) {
                    const newEnd = new Date(selected);
                    newEnd.setHours(newEnd.getHours() + 2);
                    setEndDate(newEnd);
                  }
                }
              }}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, selected) => {
                if (Platform.OS === 'android') setShowEndPicker(false);
                if (selected) {
                  // Keep same date as start, adjust time
                  const newEnd = new Date(startDate);
                  newEnd.setHours(selected.getHours(), selected.getMinutes());
                  setEndDate(newEnd);
                }
              }}
            />
          )}

          {/* ── Price ── */}
          <Text style={styles.label}>Price</Text>
          <TextInput
            style={styles.input}
            placeholder='e.g. "Free", "$25", "$10 drop-in"'
            placeholderTextColor={COLORS.textTertiary}
            value={priceText}
            onChangeText={setPriceText}
          />
          <Text style={styles.hintText}>Leave empty for "Free"</Text>

          {/* ── Recurrence ── */}
          <Text style={[styles.label, { marginBottom: SPACING.md }]}>Recurrence</Text>
          <RecurrencePicker value={recurrence} onChange={setRecurrence} />

          {/* ── Cover image ── */}
          <Text style={[styles.label, { marginTop: SPACING.xl }]}>Cover image</Text>
          <ImagePickerButton
            imageUri={coverImageUri}
            onImageSelected={(uri) => setCoverImageUri(uri)}
            onImageRemoved={() => setCoverImageUri(null)}
          />

          {/* ── Bottom publish button ── */}
          <TouchableOpacity
            style={[styles.bottomPublishBtn, !isValid && styles.bottomPublishBtnMuted]}
            onPress={handlePublish}
          >
            <Text style={styles.bottomPublishBtnText}>
              {!isVerified ? 'Verify & Publish' : isEdit ? 'Save Changes' : 'Publish Event'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: insets.bottom + 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Phone verification modal */}
      <PhoneVerifyModal
        visible={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onVerified={handleVerified}
      />
    </View>
  );
}

// Build RRULE string from picker state
function buildRRule({ frequency, days, endDate }) {
  let rule = 'FREQ=';
  if (frequency === 'BIWEEKLY') {
    rule += 'WEEKLY;INTERVAL=2';
  } else {
    rule += frequency;
  }
  if ((frequency === 'WEEKLY' || frequency === 'BIWEEKLY') && days.length > 0) {
    rule += ';BYDAY=' + days.join(',');
  }
  if (endDate) {
    const until = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    rule += ';UNTIL=' + until;
  }
  return rule;
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
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    fontSize: FONT.sizes.lg,
    color: COLORS.textPrimary,
    ...FONT.semibold,
  },
  publishBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  publishBtnMuted: {
    opacity: 0.6,
  },
  publishBtnText: {
    color: COLORS.textInverse,
    fontSize: FONT.sizes.sm,
    ...FONT.semibold,
  },

  // Verify banner
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warning + '12',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  verifyBannerText: {
    flex: 1,
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
  },
  verifyBannerLink: {
    fontSize: FONT.sizes.sm,
    color: COLORS.primary,
    ...FONT.semibold,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
  },

  // Form elements
  label: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.semibold,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT.sizes.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  textArea: {
    minHeight: 100,
    paddingTop: SPACING.md,
  },
  charCount: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: FONT.sizes.xs,
    color: COLORS.error,
    marginTop: 4,
  },
  hintText: {
    fontSize: FONT.sizes.xs,
    color: COLORS.textTertiary,
    marginTop: 4,
  },

  // Category grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  categoryChipText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.medium,
  },

  // Mode row
  modeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeChipText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.medium,
  },
  modeChipTextActive: {
    color: COLORS.textInverse,
  },

  // Section block
  sectionBlock: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  sectionBlockTitle: {
    fontSize: FONT.sizes.md,
    color: COLORS.textPrimary,
    ...FONT.semibold,
    marginBottom: SPACING.sm,
  },

  // Pick on map button
  pickOnMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    backgroundColor: COLORS.primary + '08',
  },
  pickOnMapText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.primary,
    ...FONT.semibold,
  },

  // Platform chips
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  platformChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  platformChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  platformChipText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    ...FONT.medium,
  },
  platformChipTextActive: {
    color: COLORS.textInverse,
  },

  // Date/time
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  dateBtnText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textPrimary,
    ...FONT.medium,
  },
  dateArrow: {
    fontSize: FONT.sizes.md,
    color: COLORS.textTertiary,
  },

  // Bottom publish
  bottomPublishBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.xxxl,
  },
  bottomPublishBtnMuted: {
    opacity: 0.7,
  },
  bottomPublishBtnText: {
    color: COLORS.textInverse,
    fontSize: FONT.sizes.lg,
    ...FONT.semibold,
  },
});
