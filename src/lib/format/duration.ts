export const DURATION_UNITS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
};

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  const [unit, size] = Object.entries(DURATION_UNITS)
    .reverse()
    .find(([, size]) => seconds % size === 0) ?? ["s", 1];
  return `${seconds / size}${unit}`;
}

export function formatApproxDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  if (seconds >= 86400) return `${Math.round(seconds / 86400)}d`;
  if (seconds >= 3600) return `${Math.round(seconds / 3600)}h`;
  if (seconds >= 60) return `${Math.round(seconds / 60)}m`;
  return `${seconds}s`;
}

/// Approximate time between two ISO timestamps.
export function formatSpan(from: string, to: string): string {
  return formatApproxDuration(
    Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 1000)),
  );
}
