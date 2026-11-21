import { formatLocale } from "../i18n/index.ts";

type Unit = {
  letter: string;
  seconds: number;
  name: "week" | "day" | "hour" | "minute" | "second";
};

const SECOND: Unit = { letter: "s", seconds: 1, name: "second" };

const UNITS: readonly Unit[] = [
  { letter: "w", seconds: 604800, name: "week" },
  { letter: "d", seconds: 86400, name: "day" },
  { letter: "h", seconds: 3600, name: "hour" },
  { letter: "m", seconds: 60, name: "minute" },
  SECOND,
];

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

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return format(0, SECOND);
  const unit = UNITS.find((u) => seconds % u.seconds === 0) ?? SECOND;
  return format(seconds / unit.seconds, unit);
}

export function formatApproxDuration(seconds: number): string {
  if (seconds <= 0) return format(0, SECOND);
  const unit =
    UNITS.find((u) => u.name !== "week" && seconds >= u.seconds) ?? SECOND;
  return format(Math.round(seconds / unit.seconds), unit);
}

export function formatCountdown(remainingMs: number): string {
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function formatSpan(from: string, to: string): string {
  return formatApproxDuration(
    Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 1000)),
  );
}
