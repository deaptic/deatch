import emojiGroups from "unicode-emoji-json/data-by-group.json" with { type: "json" };
import { emojiUrl } from "./helpers.ts";
import type { PickerSection } from "./sections.ts";
import type { EmoteGridItem } from "./types.ts";

export const EMOJI_SECTIONS: PickerSection[] = emojiGroups.map((g) => ({
  id: `emoji-${g.slug}`,
  label: g.name,
  items: g.emojis.map((e): EmoteGridItem => ({
    value: e.emoji,
    url: emojiUrl(e.emoji),
    label: e.name,
  })),
}));

export const EMOJI_ITEMS = EMOJI_SECTIONS.flatMap((s) => s.items);
