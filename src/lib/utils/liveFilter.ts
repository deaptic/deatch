import type { Category, Stream } from "../types/index.ts";

export function matchingStreams(
  streams: readonly Stream[],
  language: string,
  category: Category | null,
): Stream[] {
  return streams.filter(
    (s) =>
      (!language || s.language === language) &&
      (!category || s.game.id === category.id),
  );
}

export function byViewers(streams: readonly Stream[]): Stream[] {
  return [...streams].sort((a, b) => b.viewerCount - a.viewerCount);
}

export type StreamSort = "viewers" | "recent";

const byStart = (streams: readonly Stream[]): Stream[] =>
  [...streams].sort(
    (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt),
  );

export function sortStreams(
  streams: readonly Stream[],
  sort: StreamSort,
): Stream[] {
  return sort === "viewers" ? byViewers(streams) : byStart(streams);
}
