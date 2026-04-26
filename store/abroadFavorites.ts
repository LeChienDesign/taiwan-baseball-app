import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'abroad-favorites';

let favoriteIds = new Set<string>();
let hydrated = false;
let hydratingPromise: Promise<void> | null = null;

const listeners = new Set<() => void>();

function isBrowser() {
  return typeof window !== 'undefined';
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function getSnapshot() {
  return {
    favoriteIds: new Set(favoriteIds),
    isHydrated: hydrated,
  };
}

async function persistFavorites() {
  if (!isBrowser()) return;

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...favoriteIds]));
  } catch (error) {
    console.warn('persistFavorites failed:', error);
  }
}

async function hydrateFavorites() {
  if (!isBrowser()) return;
  if (hydrated) return;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (Array.isArray(parsed)) {
      favoriteIds = new Set(parsed.filter((item) => typeof item === 'string'));
    }
  } catch (error) {
    console.warn('hydrateFavorites failed:', error);
    favoriteIds = new Set();
  } finally {
    hydrated = true;
    hydratingPromise = null;
    emitChange();
  }
}

function ensureInitialized() {
  if (!isBrowser()) return;
  if (hydrated) return;
  if (!hydratingPromise) {
    hydratingPromise = hydrateFavorites();
  }
}

export async function toggleAbroadFavorite(id: string) {
  if (!id) return;

  ensureInitialized();
  if (hydratingPromise) {
    await hydratingPromise;
  }

  if (favoriteIds.has(id)) {
    favoriteIds.delete(id);
  } else {
    favoriteIds.add(id);
  }

  emitChange();
  await persistFavorites();
}

export async function clearAbroadFavorites() {
  ensureInitialized();
  if (hydratingPromise) {
    await hydratingPromise;
  }

  favoriteIds = new Set();
  emitChange();

  if (!isBrowser()) return;

  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('clearAbroadFavorites failed:', error);
  }
}

export function useAbroadFavorites() {
  const [snapshot, setSnapshot] = useState(getSnapshot());

  useEffect(() => {
    if (!isBrowser()) return;

    ensureInitialized();

    const handleChange = () => {
      setSnapshot(getSnapshot());
    };

    listeners.add(handleChange);
    handleChange();

    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  return {
    favoriteIds: [...snapshot.favoriteIds],
    favoriteCount: snapshot.favoriteIds.size,
    isHydrated: snapshot.isHydrated,
    isFavorite: (id: string) => snapshot.favoriteIds.has(id),
  };
}