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

const PROVIDERS = ["7tv", "bttv", "ffz"] as const;
const PROVIDER_SECTION = /^(7tv|bttv|ffz)(-channel)?$/;

export function providerScope(sectionId: string): "channel" | "global" | null {
  const match = PROVIDER_SECTION.exec(sectionId);
  if (!match) return null;
  return match[2] ? "channel" : "global";
}

export function mergeProviders(sections: PickerSection[]): PickerSection[] {
  const byProvider = new Map<string, PickerSection>();
  const others: PickerSection[] = [];
  for (const section of sections) {
    const provider = PROVIDER_SECTION.exec(section.id)?.[1];
    if (!provider) {
      others.push(section);
      continue;
    }
    const existing = byProvider.get(provider);
    if (!existing) {
      const first = { ...section, id: provider };
      byProvider.set(provider, first);
      continue;
    }
    const seen = new Set(existing.items.map((item) => item.value));
    existing.items = [
      ...existing.items,
      ...section.items.filter((item) => !seen.has(item.value)),
    ];
  }
  return [...PROVIDERS.flatMap((p) => byProvider.get(p) ?? []), ...others];
}
