export const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type Dated = { timestamp: number };

export function fresh<T extends Dated>(list: T[], now: number): T[] {
  return list.filter((m) => now - m.timestamp < MAX_AGE_MS);
}

export function msUntilNextExpiry(list: Dated[], now: number): number | null {
  if (list.length === 0) return null;
  const oldest = Math.min(...list.map((m) => m.timestamp));
  return Math.max(0, oldest + MAX_AGE_MS - now);
}
