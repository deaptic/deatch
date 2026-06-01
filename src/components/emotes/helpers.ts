import type { EmoteGridItem } from "./types.ts";

export const COLUMNS = 8;

export type RenderSection = {
  label?: string;
  items: EmoteGridItem[];
  emptyHint?: string;
  startIndex: number;
};

export function emojiUrl(emoji: string): string {
  const points: string[] = [];
  for (const char of emoji) {
    const cp = char.codePointAt(0);
    if (cp !== undefined && cp !== 0xfe0f) points.push(cp.toString(16));
  }
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${
    points.join("-")
  }.png`;
}

export const toItem = (e: { name: string; url: string }): EmoteGridItem => ({
  value: e.name,
  url: e.url,
  label: e.name,
});

export function nextVerticalIndex(
  sections: RenderSection[],
  activeIndex: number,
  direction: 1 | -1,
): number {
  const secIdx = sections.findIndex(
    (s) =>
      activeIndex >= s.startIndex &&
      activeIndex < s.startIndex + s.items.length,
  );
  if (secIdx < 0) return activeIndex;
  const sec = sections[secIdx];
  const pos = activeIndex - sec.startIndex;
  const col = pos % COLUMNS;
  const targetRow = Math.floor(pos / COLUMNS) + direction;

  // Same section, adjacent row exists.
  if (targetRow >= 0 && targetRow * COLUMNS < sec.items.length) {
    const newPos = Math.min(targetRow * COLUMNS + col, sec.items.length - 1);
    return sec.startIndex + newPos;
  }

  // Jump to nearest non-empty section in that direction.
  for (
    let i = secIdx + direction;
    i >= 0 && i < sections.length;
    i += direction
  ) {
    const target = sections[i];
    if (!target.items.length) continue;
    const row = direction === 1
      ? 0
      : Math.floor((target.items.length - 1) / COLUMNS);
    const newPos = Math.min(row * COLUMNS + col, target.items.length - 1);
    return target.startIndex + newPos;
  }
  return activeIndex;
}
