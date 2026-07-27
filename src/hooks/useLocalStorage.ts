import { useState, useEffect } from 'react';

function getStorageValue<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(`global-payments-${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => getStorageValue(key, defaultValue));

  useEffect(() => {
    localStorage.setItem(`global-payments-${key}`, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

