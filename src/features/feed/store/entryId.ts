import type { FeedEntry } from "../../../shared/types/index.ts";

export function getEntryId(item: FeedEntry): string {
  return item.kind === "message" ? item.message_id : item.id;
}
