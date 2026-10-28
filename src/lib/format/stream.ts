import { formatLocale, t } from "../i18n/index.ts";

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

type Described = { title: string; game: { name: string } };

/// The live stream's title, else the one the channel last set.
export function streamTitle(stream?: Described, info?: Described): string {
  return stream?.title ?? info?.title ?? "";
}

export function streamGame(stream?: Described, info?: Described): string {
  return stream?.game.name ?? info?.game.name ?? "";
}

/// "Live · game · viewers" for a live channel, skipping what is unknown.
export function liveLine(game?: string, viewers?: number): string {
  const parts = [t("COMMON_LIVE"), game];
  if (viewers !== undefined) parts.push(formatViewers(viewers));
  return parts.filter(Boolean).join(" · ");
}
