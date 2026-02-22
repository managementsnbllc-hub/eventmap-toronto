// ─── Haptic Feedback Utility ───
// Light wrapper around expo-haptics. No-op if not installed.
// Usage: haptic.light() on saves, haptic.medium() on toggles, haptic.success() on publish

let Haptics = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // expo-haptics not installed — stubs below
}

export const haptic = {
  /** Light tap — save, bookmark, chip select */
  light() {
    Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
  },
  /** Medium tap — toggles, mode switch */
  medium() {
    Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium);
  },
  /** Heavy tap — delete, destructive action */
  heavy() {
    Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Heavy);
  },
  /** Success — publish, verify, complete */
  success() {
    Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
  },
  /** Error — validation fail */
  error() {
    Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Error);
  },
  /** Selection — picker change */
  selection() {
    Haptics?.selectionAsync?.();
  },
};
