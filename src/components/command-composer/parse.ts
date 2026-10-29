import { t } from "../../lib/i18n/index.ts";
import type { CommandOption, DurationOption } from "./types.ts";
import { formatDuration, secondsPer } from "../../lib/format/duration.ts";
import { at } from "../../lib/utils/at.ts";
import { formatAlternatives } from "../../lib/format/list.ts";

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

export function emptySlot(): Slot {
  return { raw: "", resolved: null, displayLabel: "", error: null };
}

export function chosenSlot(label: string, resolved: unknown): Slot {
  return { raw: label, resolved, displayLabel: label, error: null };
}

export function slotFromInput(opt: CommandOption, value: string): Slot {
  const typed = { raw: value, displayLabel: value };
  switch (opt.type) {
    case "duration": {
      if (value === "") return { ...typed, resolved: null, error: null };
      const seconds = parseDuration(value);
      const message = durationError(opt, seconds);
      return message
        ? { ...typed, resolved: null, error: invalid(message) }
        : { ...typed, resolved: seconds, error: null };
    }
    case "user":
    case "search":
      return { ...typed, resolved: null, error: null };
    case "enum": {
      const exact = opt.values.includes(value);
      return {
        ...typed,
        resolved: exact ? value : null,
        error:
          value !== "" && !exact
            ? invalid(
                t("COMMAND_ENUM_INVALID", {
                  values: formatAlternatives(opt.values),
                }),
              )
            : null,
      };
    }
    case "string":
      return { ...typed, resolved: value === "" ? null : value, error: null };
  }
}

export function enumMatches(values: string[], raw: string): string[] {
  const q = raw.toLowerCase();
  return q === "" ? values : values.filter((v) => v.toLowerCase().includes(q));
}

export function allSatisfied(options: CommandOption[], slots: Slot[]): boolean {
  return options.every((opt, i) => slotSatisfied(opt, at(slots, i)));
}

export function withRequiredFlagged(
  options: CommandOption[],
  slots: Slot[],
): Slot[] {
  return slots.map((slot, i) =>
    options[i]?.required && slot.resolved === null && !slot.error
      ? { ...slot, error: { kind: "required" } }
      : slot,
  );
}

export function withoutRequiredFlags(slots: Slot[]): Slot[] {
  return slots.map((slot) =>
    slot.error?.kind === "required" ? { ...slot, error: null } : slot,
  );
}

export function valuesOf(
  options: CommandOption[],
  slots: Slot[],
): Record<string, unknown> {
  return Object.fromEntries(
    options.map((opt, i) => [opt.name, at(slots, i).resolved ?? null]),
  );
}
