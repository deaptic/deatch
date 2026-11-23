import type { StorageKey } from "./storageKeys.ts";
import * as storage from "./storage.ts";

type Cached<T> = { ts: number; data: T };

function isCached(value: unknown): value is Cached<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "ts" in value &&
    typeof value.ts === "number" &&
    "data" in value
  );
}

export function loadCache<T>(key: StorageKey, maxAgeMs: number): T | null {
  const cached = storage.read(key);
  if (!isCached(cached) || Date.now() - cached.ts > maxAgeMs) return null;
  return cached.data as T;
}

export function saveCache<T>(key: StorageKey, data: T): void {
  storage.write(key, { ts: Date.now(), data } satisfies Cached<T>);
}
