import type { CommandOption, DurationOption } from "./types.ts";

export type Slot = {
  raw: string;
  resolved: unknown | null;
  displayLabel: string;
  error: string | null;
};

const DURATION_UNITS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
};

export function parseDuration(raw: string): number | null {
  const text = raw.trim().toLowerCase();
  if (!/^(\d+[smhdw]?)+$/.test(text)) return null;
  let total = 0;
  for (const [, n, unit] of text.matchAll(/(\d+)([smhdw]?)/g)) {
    total += parseInt(n, 10) * (DURATION_UNITS[unit] ?? 1);
  }
  return total;
}

export function formatDuration(seconds: number): string {
  const [unit, size] = Object.entries(DURATION_UNITS)
    .reverse()
    .find(([, size]) => seconds % size === 0) ?? ["s", 1];
  return `${seconds / size}${unit}`;
}

export function durationError(
  opt: DurationOption,
  seconds: number | null,
): string | null {
  if (seconds === null) return `Try ${opt.hint ?? "30s, 5m, 1h"}`;
  const min = opt.min ?? 0;
  const max = opt.max ?? Infinity;
  if (seconds >= min && seconds <= max) return null;
  return max === Infinity
    ? `Must be at least ${formatDuration(min)}`
    : `Must be ${formatDuration(min)}–${formatDuration(max)}`;
}

export function slotSatisfied(opt: CommandOption, slot: Slot): boolean {
  if (slot.error) return false;
  return !opt.required || slot.resolved !== null;
}
