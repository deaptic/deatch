import { formatLocale } from "../i18n/index.ts";

type Unit = {
  /// What users type after a number: `10m`, `1h30m`.
  letter: string;
  seconds: number;
  name: "week" | "day" | "hour" | "minute" | "second";
};

const SECOND: Unit = { letter: "s", seconds: 1, name: "second" };

/// Largest first.
const UNITS: readonly Unit[] = [
  { letter: "w", seconds: 604800, name: "week" },
  { letter: "d", seconds: 86400, name: "day" },
  { letter: "h", seconds: 3600, name: "hour" },
  { letter: "m", seconds: 60, name: "minute" },
  SECOND,
];

/// Seconds per typed unit letter; a bare number is seconds.
export function secondsPer(letter: string): number {
  return UNITS.find((u) => u.letter === letter)?.seconds ?? 1;
}

function format(value: number, unit: Unit): string {
  return new Intl.NumberFormat(formatLocale(), {
    style: "unit",
    unit: unit.name,
    unitDisplay: "narrow",
  }).format(value);
}

/// Exact, in the largest unit that divides it evenly.
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return format(0, SECOND);
  const unit = UNITS.find((u) => seconds % u.seconds === 0) ?? SECOND;
  return format(seconds / unit.seconds, unit);
}

/// Rounded to the nearest whole unit, up to days.
export function formatApproxDuration(seconds: number): string {
  if (seconds <= 0) return format(0, SECOND);
  const unit =
    UNITS.find((u) => u.name !== "week" && seconds >= u.seconds) ?? SECOND;
  return format(Math.round(seconds / unit.seconds), unit);
}

/// Approximate time between two ISO timestamps.
export function formatSpan(from: string, to: string): string {
  return formatApproxDuration(
    Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 1000)),
  );
}
