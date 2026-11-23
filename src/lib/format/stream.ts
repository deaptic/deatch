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

export function streamTitle(stream?: Described, info?: Described): string {
  return stream?.title ?? info?.title ?? "";
}

export function streamGame(stream?: Described, info?: Described): string {
  return stream?.game.name ?? info?.game.name ?? "";
}

export function liveLine(game?: string, viewers?: number): string {
  const parts = [t("UI_STREAM_LIVE_STATUS"), game];
  if (viewers !== undefined) parts.push(formatViewers(viewers));
  return parts.filter(Boolean).join(" · ");
}

type Details = { tags: string[]; isMature: boolean; startedAt: string };

export function streamDetails(stream: Details): string {
  return [
    stream.tags.join(" · "),
    stream.isMature ? t("HEADER_MATURE_STATUS") : "",
    t("HEADER_LIVE_SINCE_STATUS", { time: new Date(stream.startedAt) }),
  ]
    .filter(Boolean)
    .join("\n");
}
