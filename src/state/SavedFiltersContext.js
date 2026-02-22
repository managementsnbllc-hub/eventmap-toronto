import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SavedFiltersContext = createContext(null);

const STORAGE_KEY = '@eventmap_saved_filters';

// Each preset: { id, name, icon, filters: { ...filterEngine DEFAULT_FILTERS shape } }

export function SavedFiltersProvider({ children }) {
  const [presets, setPresets] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load from storage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setPresets(JSON.parse(stored));
      } catch (e) {
        console.warn('[SavedFilters] Failed to load:', e);
      }
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback(async (list) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list)).catch(() => {});
  }, []);

  const savePreset = useCallback(async (name, filters, icon = 'bookmark') => {
    const preset = {
      id: 'preset-' + Date.now(),
      name,
      icon,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };
    setPresets((prev) => {
      const next = [preset, ...prev];
      persist(next);
      return next;
    });
    return preset;
  }, [persist]);

  const deletePreset = useCallback(async (presetId) => {
    setPresets((prev) => {
      const next = prev.filter((p) => p.id !== presetId);
      persist(next);
      return next;
    });
  }, [persist]);

  const renamePreset = useCallback(async (presetId, newName) => {
    setPresets((prev) => {
      const next = prev.map((p) => p.id === presetId ? { ...p, name: newName } : p);
      persist(next);
      return next;
    });
  }, [persist]);

  const value = useMemo(() => ({
    presets,
    loaded,
    savePreset,
    deletePreset,
    renamePreset,
  }), [presets, loaded, savePreset, deletePreset, renamePreset]);

  return (
    <SavedFiltersContext.Provider value={value}>
      {children}
    </SavedFiltersContext.Provider>
  );
}

export function useSavedFilters() {
  const ctx = useContext(SavedFiltersContext);
  if (!ctx) throw new Error('useSavedFilters must be used within SavedFiltersProvider');
  return ctx;
}
