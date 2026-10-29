import { formatLocale } from "../i18n/index.ts";

export function formatPx(value: number): string {
  return `${value}px`;
}

function percent(value: number, digits: number): string {
  return new Intl.NumberFormat(formatLocale(), {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value / 100);
}

/// A setting kept as a whole percent, like a volume or a zoom.
export function formatWholePercent(value: number): string {
  return percent(value, 0);
}

export function formatPercent(value: number): string {
  return percent(value, value < 10 ? 1 : 0);
}
