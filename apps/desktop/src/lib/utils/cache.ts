type Cached<T> = { ts: number; data: T };

export function loadCache<T>(key: string, maxAgeMs: number): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached<T>;
    if (Date.now() - parsed.ts > maxAgeMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function saveCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Quota exceeded or storage unavailable — silently skip.
  }
}
