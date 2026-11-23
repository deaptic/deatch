import type { JSX } from "solid-js";
import type { EmoteGridItem } from "./types.ts";
import { at } from "../../../shared/at.ts";

export const COLUMNS = 8;
export const GRID_COLUMNS = "grid-cols-8";

export type RenderSection = {
  id: string;
  label?: string;
  icon?: () => JSX.Element;
  empty?: string;
  items: EmoteGridItem[];
  startIndex: number;
};

export function emojiUrl(emoji: string): string {
  const keepSelector = emoji.includes("‍");
  const points: string[] = [];
  for (const char of emoji) {
    const cp = char.codePointAt(0);
    if (cp === undefined || (cp === 0xfe0f && !keepSelector)) continue;
    points.push(cp.toString(16));
  }
  return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.3/assets/72x72/${points.join(
    "-",
  )}.png`;
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
  const sec = sections[secIdx];
  if (!sec) return activeIndex;
  const pos = activeIndex - sec.startIndex;
  const col = pos % COLUMNS;
  const targetRow = Math.floor(pos / COLUMNS) + direction;

  if (targetRow >= 0 && targetRow * COLUMNS < sec.items.length) {
    const newPos = Math.min(targetRow * COLUMNS + col, sec.items.length - 1);
    return sec.startIndex + newPos;
  }

  for (
    let i = secIdx + direction;
    i >= 0 && i < sections.length;
    i += direction
  ) {
    const target = at(sections, i);
    if (!target.items.length) continue;
    const row =
      direction === 1 ? 0 : Math.floor((target.items.length - 1) / COLUMNS);
    const newPos = Math.min(row * COLUMNS + col, target.items.length - 1);
    return target.startIndex + newPos;
  }
  return activeIndex;
}
