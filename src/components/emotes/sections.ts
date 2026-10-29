import type { RenderSection } from "./helpers.ts";
import type { EmoteGridItem } from "./types.ts";

export type PickerSection = Omit<RenderSection, "startIndex">;

export function indexSections(sections: PickerSection[]): RenderSection[] {
  let offset = 0;
  return sections.map((s) => {
    const indexed = { ...s, startIndex: offset };
    offset += s.items.length;
    return indexed;
  });
}

export function matchingItems(
  items: EmoteGridItem[],
  query: string,
): EmoteGridItem[] {
  const q = query.toLowerCase();
  return items.filter((i) => i.label.toLowerCase().includes(q));
}

export function itemAt(
  sections: RenderSection[],
  index: number,
): EmoteGridItem | undefined {
  for (const s of sections) {
    const pos = index - s.startIndex;
    if (pos >= 0 && pos < s.items.length) return s.items[pos];
  }
  return undefined;
}
