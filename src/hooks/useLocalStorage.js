import { useState, useEffect } from 'react';

/**
 * Persist state in localStorage under the given key.
 * Usage: const [value, setValue] = useLocalStorage('key', defaultValue);
 */
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota exceeded or private-mode — silently ignore
    }
  }, [key, value]);

  return [value, setValue];
}
