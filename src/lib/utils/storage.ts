import { isStorageKey, type StorageKey } from "../constants/storage.ts";

/// Parsed JSON stored under `key`; null when missing or unreadable. Callers
/// validate the shape, since stored data outlives the code that wrote it.
export function read(key: StorageKey): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch (e) {
    console.warn(`storage: ${key} not read`, e);
    return null;
  }
}

/// A full or unavailable storage is logged, never thrown.
export function write(key: StorageKey, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`storage: ${key} not written`, e);
  }
}

/// Removes keys no current code reads, left by earlier versions.
export function prune(): void {
  removeWhere((key) => !isStorageKey(key));
}

export function removeWhere(match: (key: string) => boolean): void {
  try {
    const keys = Array.from({ length: localStorage.length }, (_, i) =>
      localStorage.key(i),
    );
    for (const key of keys) {
      if (key !== null && match(key)) localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn("storage: keys not removed", e);
  }
}
