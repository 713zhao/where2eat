import { useState } from 'react';

const STORAGE_KEY = 'where2eat.lastLocation.v1';

export interface SavedLocation {
  lat: number;
  lon: number;
  address: string | null;
  savedAt: number;
}

function loadLastLocation(): SavedLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.lat !== 'number' || typeof parsed.lon !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function useLastLocation() {
  const [lastLocation, setLastLocation] = useState<SavedLocation | null>(loadLastLocation);

  function saveLastLocation(loc: SavedLocation) {
    setLastLocation(loc);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    } catch {
      // localStorage unavailable (private mode, quota) - just skip persisting
    }
  }

  return { lastLocation, saveLastLocation };
}
