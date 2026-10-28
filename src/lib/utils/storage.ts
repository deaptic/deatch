/// Parsed JSON stored under `key`; null when missing or unreadable. Callers
/// validate the shape, since stored data outlives the code that wrote it.
export function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch (e) {
    console.warn(`storage: ${key} not read`, e);
    return null;
  }
}

/// A full or unavailable storage is logged, never thrown.
export function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`storage: ${key} not written`, e);
  }
}
