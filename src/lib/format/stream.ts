import { formatLocale } from "../i18n/index.ts";

export function formatViewers(n: number, locale = formatLocale()): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

const pad = (n: number) => String(n).padStart(2, "0");

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${pad(m)}:${pad(s)}`;
}

export function formatUptime(startedAt: string, now: number): string {
  const start = new Date(startedAt).getTime();
  if (Number.isNaN(start)) return "";
  return formatClock(now - start);
}
