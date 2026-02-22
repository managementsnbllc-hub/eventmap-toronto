// ─── Push Notification Service ───
// Uses expo-notifications for local + push notifications.
// Local notifications for saved event reminders.
// Push notifications (via Supabase Edge Functions) for new events nearby.
//
// Install: npx expo install expo-notifications expo-device expo-constants

import { Platform } from 'react-native';

let Notifications = null;
let Device = null;

// Lazy load — avoids crash if not installed yet
try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch (e) {
  console.log('[pushService] expo-notifications not installed — using stubs');
}

// ─── Permission ───

export async function requestPushPermission() {
  if (!Notifications || !Device) {
    console.log('[pushService] Stub: permission granted');
    return { granted: true, token: 'stub-token' };
  }

  if (!Device.isDevice) {
    console.log('[pushService] Must use physical device for push notifications');
    return { granted: false, token: null };
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { granted: false, token: null };
  }

  // Get Expo push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    return { granted: true, token: tokenData.data };
  } catch (err) {
    console.warn('[pushService] Token error:', err);
    return { granted: true, token: null };
  }
}

// ─── Channel setup (Android) ───

export async function setupNotificationChannels() {
  if (!Notifications || Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('event-reminders', {
    name: 'Event Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });

  await Notifications.setNotificationChannelAsync('new-events', {
    name: 'New Events Nearby',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

// ─── Local notifications (reminders) ───

/**
 * Schedule a reminder for a saved event.
 * @param {Object} event - Event object with starts_at, title, venue_name
 * @param {number} minutesBefore - Minutes before event start
 * @returns {string|null} Notification identifier
 */
export async function scheduleEventReminder(event, minutesBefore = 60) {
  if (!Notifications) {
    console.log('[pushService] Stub: scheduled reminder for', event.title);
    return 'stub-notif-' + Date.now();
  }

  const triggerDate = new Date(event.starts_at);
  triggerDate.setMinutes(triggerDate.getMinutes() - minutesBefore);

  // Don't schedule if trigger is in the past
  if (triggerDate <= new Date()) {
    return null;
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Starts in ${minutesBefore} min ⏰`,
        body: `${event.title} at ${event.venue_name || 'Online'}`,
        data: { eventId: event.id, type: 'event_reminder' },
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'event-reminders' }),
      },
      trigger: { date: triggerDate },
    });
    return id;
  } catch (err) {
    console.warn('[pushService] Schedule error:', err);
    return null;
  }
}

/**
 * Cancel a specific scheduled notification.
 */
export async function cancelNotification(notificationId) {
  if (!Notifications || !notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (err) {
    console.warn('[pushService] Cancel error:', err);
  }
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications() {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    console.warn('[pushService] Cancel all error:', err);
  }
}

// ─── Listeners ───

/**
 * Add a listener for received notifications (app in foreground).
 * @returns {{ remove: Function }}
 */
export function addNotificationReceivedListener(callback) {
  if (!Notifications) return { remove: () => {} };
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a listener for notification taps (user interacts with notification).
 * @returns {{ remove: Function }}
 */
export function addNotificationResponseListener(callback) {
  if (!Notifications) return { remove: () => {} };
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// ─── Foreground behavior ───

export function setForegroundBehavior() {
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
