import type { FeedEntry } from "../../types/feed.ts";
import { at } from "../../utils/at.ts";

export const MESSAGE_CAP = 400;
const CATEGORY_CAPS: Record<string, number> = {
  message: MESSAGE_CAP,
};
const DEFAULT_CAP = 50;
// A paused feed keeps scrollback, but still needs a ceiling or a busy
// channel left scrolled up grows without bound.
const PAUSED_FACTOR = 5;

function categoryOf(item: FeedEntry): string {
  return item.kind === "message" ? "message" : item.notice_type;
}

export function enforceCaps(messages: FeedEntry[], paused = false) {
  const factor = paused ? PAUSED_FACTOR : 1;
  const counts: Record<string, number> = {};
  const keep = Array.from({ length: messages.length }, () => false);
  for (let i = messages.length - 1; i >= 0; i--) {
    const cat = categoryOf(at(messages, i));
    counts[cat] = (counts[cat] ?? 0) + 1;
    keep[i] = counts[cat] <= (CATEGORY_CAPS[cat] ?? DEFAULT_CAP) * factor;
  }
  let w = 0;
  for (let i = 0; i < messages.length; i++) {
    if (keep[i]) messages[w++] = at(messages, i);
  }
  messages.length = w;
}
