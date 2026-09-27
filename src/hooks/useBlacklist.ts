import { useState } from 'react';

const STORAGE_KEY = 'where2eat.blacklist.v1';

function loadBlacklist(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

/** Places the user has explicitly excluded from ever being spun, persisted across visits. */
export function useBlacklist() {
  const [blacklist, setBlacklist] = useState<Set<string>>(loadBlacklist);

  function toggleBlacklist(id: string) {
    setBlacklist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // localStorage unavailable (private mode, quota) - still works for this session
      }
      return next;
    });
  }

  return { blacklist, toggleBlacklist };
}
