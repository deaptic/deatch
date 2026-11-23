import type { FeedEntry } from "../../../lib/types/index.ts";

export function getEntryId(item: FeedEntry): string {
  return item.kind === "message" ? item.message_id : item.id;
}
