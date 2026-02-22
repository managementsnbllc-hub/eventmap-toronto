import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotifPrefsContext = createContext(null);

const STORAGE_KEY = '@eventmap_notif_prefs';

const DEFAULT_PREFS = {
  pushEnabled: false,
  savedEventReminders: true,       // remind before saved events start
  reminderMinutesBefore: 60,       // 60 min before
  newEventsNearby: true,            // alert when new events appear nearby
  categoryAlerts: [],               // empty = all categories
  radiusKm: 5,                      // nearby radius
  quietHoursEnabled: false,
  quietStart: '22:00',
  quietEnd: '08:00',
};

export function NotifPrefsProvider({ children }) {
  const [prefs, setPrefs] = useState({ ...DEFAULT_PREFS });
  const [loaded, setLoaded] = useState(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setPrefs((prev) => ({ ...prev, ...JSON.parse(stored) }));
        }
      } catch (e) {
        console.warn('[NotifPrefs] Failed to load:', e);
      }
      setLoaded(true);
    })();
  }, []);

  // Persist on change
  const updatePrefs = useCallback(async (partial) => {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const toggleCategory = useCallback((catKey) => {
    setPrefs((prev) => {
      const cats = prev.categoryAlerts.includes(catKey)
        ? prev.categoryAlerts.filter((c) => c !== catKey)
        : [...prev.categoryAlerts, catKey];
      const next = { ...prev, categoryAlerts: cats };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const resetPrefs = useCallback(async () => {
    setPrefs({ ...DEFAULT_PREFS });
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const value = useMemo(() => ({
    prefs,
    loaded,
    updatePrefs,
    toggleCategory,
    resetPrefs,
  }), [prefs, loaded, updatePrefs, toggleCategory, resetPrefs]);

  return (
    <NotifPrefsContext.Provider value={value}>
      {children}
    </NotifPrefsContext.Provider>
  );
}

export function useNotifPrefs() {
  const ctx = useContext(NotifPrefsContext);
  if (!ctx) throw new Error('useNotifPrefs must be used within NotifPrefsProvider');
  return ctx;
}

export { DEFAULT_PREFS };
