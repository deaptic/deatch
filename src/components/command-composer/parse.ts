import { t } from "../../lib/i18n/index.ts";
import type { CommandOption, DurationOption } from "./types.ts";
import { formatDuration, secondsPer } from "../../lib/format/duration.ts";
import { at } from "../../lib/utils/at.ts";

/// A missing required value flashes and clears itself; an invalid one stays
/// until it is edited.
type SlotError = { kind: "required" } | { kind: "invalid"; message: string };

export type Slot = {
  raw: string;
  resolved: unknown;
  displayLabel: string;
  error: SlotError | null;
};

export function invalid(message: string): SlotError {
  return { kind: "invalid", message };
}

export function slotErrorText(error: SlotError): string {
  return error.kind === "required" ? t("COMMAND_REQUIRED") : error.message;
}

export function parseDuration(raw: string): number | null {
  const text = raw.trim().toLowerCase();
  if (!/^(\d+[smhdw]?)+$/.test(text)) return null;
  let total = 0;
  for (const match of text.matchAll(/(\d+)([smhdw]?)/g)) {
    const unit = secondsPer(at(match, 2));
    total += parseInt(at(match, 1), 10) * unit;
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
