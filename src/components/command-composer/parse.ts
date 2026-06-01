import type { CommandOption } from "./types";

export type Slot = {
  raw: string;
  resolved: unknown | null;
  displayLabel: string;
  error: string | null;
};

const DURATION_UNITS: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };

export function parseDuration(raw: string): number | null {
  const m = raw.match(/^(\d+)([smhdw]?)$/);
  if (!m) return null;
  return parseInt(m[1], 10) * (DURATION_UNITS[m[2]] ?? 1);
}

export function slotSatisfied(opt: CommandOption, slot: Slot): boolean {
  if (slot.error) return false;
  return !opt.required || slot.resolved !== null;
}
