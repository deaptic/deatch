const SIZE_SUFFIX = /\d+x\d+(\.\w+)$/;

export function sizedAvatarUrl(url: string, px: number): string {
  return url.replace(SIZE_SUFFIX, `${px}x${px}$1`);
}

export function requestsInWindow(
  sentAt: readonly number[],
  now: number,
  windowMs: number,
): number[] {
  return sentAt.filter((t) => now - t < windowMs);
}

export type CachedAvatar = { url: string; at: number };

export function freshEntries(
  entries: Record<string, CachedAvatar>,
  now: number,
  ttlMs: number,
  max: number,
): Record<string, CachedAvatar> {
  const fresh = Object.entries(entries)
    .filter(([, e]) => now - e.at < ttlMs)
    .sort(([, a], [, b]) => b.at - a.at)
    .slice(0, max);
  return Object.fromEntries(fresh);
}
