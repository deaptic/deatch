const FRESH_MS = 5 * 60 * 1000;

const entries = new Map<string, { at: number; value: Promise<unknown> }>();

export function cached<T>(
  key: string,
  load: () => Promise<T>,
  fallback: T,
): Promise<T> {
  const now = Date.now();
  const kept = entries.get(key);
  if (kept && now - kept.at < FRESH_MS) return kept.value as Promise<T>;
  for (const [old, entry] of entries) {
    if (now - entry.at >= FRESH_MS) entries.delete(old);
  }
  const value = load().catch(() => {
    entries.delete(key);
    return fallback;
  });
  entries.set(key, { at: now, value });
  return value;
}
