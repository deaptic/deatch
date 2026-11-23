export function createErrorThrottle(windowMs: number) {
  const lastShown = new Map<string, number>();
  return (key: string, now: number): boolean => {
    const last = lastShown.get(key);
    if (last !== undefined && now - last < windowMs) return false;
    lastShown.set(key, now);
    return true;
  };
}
