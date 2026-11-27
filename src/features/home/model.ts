import { startOfDay } from "../../shared/time.ts";

const COMING_UP_MS = 7 * 24 * 60 * 60 * 1000;

export function comingUp<T extends { start: string }>(
  streams: readonly T[],
  now: number,
): T[] {
  const startOf = (stream: T) => Date.parse(stream.start);
  return streams
    .filter((stream) => {
      const start = startOf(stream);
      return start >= now && start < now + COMING_UP_MS;
    })
    .sort((a, b) => startOf(a) - startOf(b));
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_DAYS = 7;

export const weekStart = (now: number) =>
  startOfDay(now) - (WEEK_DAYS - 1) * DAY_MS;

export type Ranked = { key: string; count: number };

export function ranked(counts: Readonly<Record<string, number>>): Ranked[] {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export const total = (rows: readonly Ranked[]) =>
  rows.reduce((sum, row) => sum + row.count, 0);

const SLICES = 4;

export type Slice = { name: string | null; count: number };

export function slices(
  entries: readonly { name: string; count: number }[],
  total: number,
): Slice[] {
  const top = entries
    .slice(0, SLICES)
    .map((entry) => ({ name: entry.name, count: entry.count }));
  const rest = total - top.reduce((sum, slice) => sum + slice.count, 0);
  return rest > 0 ? [...top, { name: null, count: rest }] : top;
}

const LATEST_LIVE = 3;

export function latestLive<T extends { startedAt: string }>(
  streams: readonly T[],
): T[] {
  const startOf = (stream: T) => Date.parse(stream.startedAt);
  return [...streams]
    .sort((x, y) => startOf(y) - startOf(x))
    .slice(0, LATEST_LIVE);
}

const HOME_CHANNELS = 40;

export function homeChannels(
  ...groups: readonly (readonly string[])[]
): string[] {
  return [...new Set(groups.flat())].slice(0, HOME_CHANNELS);
}

const ROW_TILES = 3;

export function tileRows(count: number): number[] {
  if (count <= 0) return [];
  if (count <= ROW_TILES) return [count];
  const first = Math.ceil(count / 2);
  return [first, count - first];
}
