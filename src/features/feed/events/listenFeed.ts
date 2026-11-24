import type { EventKind } from "../../../shared/types/index.ts";
import type { FeedEntry } from "../types.ts";
import type { Unlisten } from "../../../platform/unlisten.ts";
import { listenEventSub, serverTime } from "../../../platform/listen.ts";
import { appendItem } from "../store/index.ts";

export function listenFeed<T>(
  kind: EventKind,
  toEntry: (raw: T, timestamp: number) => FeedEntry | null | undefined,
  channelOf: (raw: T) => string = (raw) =>
    (raw as { broadcaster_user_id: string }).broadcaster_user_id,
): Promise<Unlisten> {
  return listenEventSub<T>(kind, (e) => {
    const entry = toEntry(e.event, serverTime(e));
    if (entry) appendItem(channelOf(e.event), entry);
  });
}
