export const EARNING_WINDOW_MS = 6 * 60_000;

export function isEarning(earnedAt: string | undefined, now: number): boolean {
  if (earnedAt === undefined) return false;
  const at = Date.parse(earnedAt);
  return Number.isFinite(at) && now - at < EARNING_WINDOW_MS;
}
