"use client";

// Saves a value on this phone/computer (the browser's localStorage) and keeps
// every part of the screen that uses it up to date. If storage is blocked
// (e.g. private mode), the app still works; it just won't remember.

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useStored<T>(key: string, fallback: T, parse: (value: unknown) => T | null): [T, (next: T) => void] {
  const getSnapshot = () => {
    const raw = readRaw(key);
    const cached = cache.get(key);
    if (cached && cached.raw === raw) return cached.value as T;
    let value: T = fallback;
    if (raw !== null) {
      try {
        value = parse(JSON.parse(raw)) ?? fallback;
      } catch {
        value = fallback;
      }
    }
    cache.set(key, { raw, value });
    return value;
  };

  const value = useSyncExternalStore(subscribe, getSnapshot, () => fallback);

  const setValue = useCallback(
    (next: T) => {
      const raw = JSON.stringify(next);
      try {
        window.localStorage.setItem(key, raw);
      } catch {
        // Storage blocked: keep the value for this visit only.
      }
      cache.set(key, { raw: readRaw(key) ?? raw, value: next });
      listeners.forEach((l) => l());
    },
    [key],
  );

  return [value, setValue];
}
