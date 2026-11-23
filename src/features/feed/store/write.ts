import { isSilent, toLog, updateFeed } from "./core.ts";
import { getEntryId } from "./entryId.ts";
import { append, insert, prepend } from "./ops.ts";
import type { FeedEntry, NoticeText } from "../../../shared/types/index.ts";
import { feedEvent } from "../entries/feedEvent.ts";
import { LOCAL } from "../../../shared/moderateActions.ts";
import { selectedChannel } from "../../navigation/index.ts";

export function appendItem(broadcasterId: string, item: FeedEntry): boolean {
  const isActive = selectedChannel()?.id === broadcasterId;
  let added = false;
  updateFeed(broadcasterId, (f) => {
    added = append(f.messages, item, f.paused);
    if (!added) return;
    toLog(broadcasterId, [item]);
    if (isActive && !f.paused && !isSilent(item)) {
      f.lastSeenEntryId = getEntryId(item);
    }
  });
  return added;
}

export function appendLocalNotice(
  broadcasterId: string,
  notice: string | NoticeText,
  noticeType = LOCAL,
) {
  appendItem(
    broadcasterId,
    feedEvent(noticeType, notice, Date.now(), { silent: true }),
  );
}

export function insertEntries(
  broadcasterId: string,
  items: FeedEntry[],
): FeedEntry[] {
  let added: FeedEntry[] = [];
  updateFeed(broadcasterId, (f) => {
    added = insert(f.messages, items, f.paused);
    toLog(broadcasterId, added);
  });
  return added;
}

export function prependEntries(
  broadcasterId: string,
  items: FeedEntry[],
): FeedEntry[] {
  let added: FeedEntry[] = [];
  updateFeed(broadcasterId, (f) => {
    f.backfilled = true;
    added = prepend(f.messages, items, f.paused);
    toLog(broadcasterId, added);
    const last = f.messages.at(-1);
    if (!f.lastSeenEntryId && last) f.lastSeenEntryId = getEntryId(last);
  });
  return added;
}
