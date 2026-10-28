import { t } from "../../lib/i18n/index.ts";
import type { CommandOption, DurationOption } from "./types.ts";
import { DURATION_UNITS, formatDuration } from "../../lib/format/duration.ts";

export type Slot = {
  raw: string;
  resolved: unknown;
  displayLabel: string;
  error: string | null;
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

export function durationError(
  opt: DurationOption,
  seconds: number | null,
): string | null {
  if (seconds === null) {
    return t("COMMAND_DURATION_TRY", {
      examples: t(opt.hint ?? "COMMAND_DURATION_EXAMPLES"),
    });
  }
  const min = opt.min ?? 0;
  const max = opt.max ?? Infinity;
  if (seconds >= min && seconds <= max) return null;
  return max === Infinity
    ? t("COMMAND_DURATION_MIN", { min: formatDuration(min) })
    : t("COMMAND_DURATION_RANGE", {
        min: formatDuration(min),
        max: formatDuration(max),
      });
}

export function slotSatisfied(opt: CommandOption, slot: Slot): boolean {
  if (slot.error) return false;
  return !opt.required || slot.resolved !== null;
}
