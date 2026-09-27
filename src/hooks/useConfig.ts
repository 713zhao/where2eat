import { useState } from 'react';
import { DEFAULT_CONFIG, type RouletteConfig } from '../types';

const STORAGE_KEY = 'where2eat.config.v1';

function loadConfig(): RouletteConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      placeTypes: { ...DEFAULT_CONFIG.placeTypes, ...parsed.placeTypes },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function useConfig() {
  const [config, setConfig] = useState<RouletteConfig>(loadConfig);

  const updateConfig = (next: RouletteConfig) => {
    setConfig(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable (private mode, quota) - config still works for this session
    }
  };

  return { config, updateConfig };
}
