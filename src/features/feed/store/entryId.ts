import type { FeedEntry } from "../types.ts";

export function getEntryId(item: FeedEntry): string {
  return item.kind === "message" ? item.message_id : item.id;
}
