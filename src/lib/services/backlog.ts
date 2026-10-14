import { getRecentMessages } from "../api/twitch/chat.ts";
import { chatterOf, mapChatMessage } from "../events/chat-mapper.ts";
import { errorMessage } from "../utils/error.ts";
import { textOf } from "../utils/message.ts";
import {
  appendItem,
  type FeedEntry,
  feeds,
  insertEntries,
  MESSAGE_CAP,
  prependEntries,
} from "../stores/feeds.ts";
import { feedEvent } from "../utils/feedEvent.ts";
import type { FeedMessage } from "../types/index.ts";
import { recordChatter, user } from "../stores/users.ts";
import { appendSentHistoryOlder } from "../stores/chatHistory.ts";

const GAP_MARGIN_MS = 5_000;
const GAP_LIMIT = 300;
const CHATTER_LIMIT = 800;

function noteChatters(broadcasterId: string, added: FeedEntry[]) {
  for (const it of added) {
    if (it.kind === "message") recordChatter(broadcasterId, chatterOf(it));
  }
}

/// Backfills messages that arrived while the EventSub socket was down.
/// Pulls from `since` minus a margin; duplicates are dropped on insert.
export function fillGap(
  broadcasterId: string,
  channelLogin: string,
  sinceMs: number,
): Promise<void> {
  return getRecentMessages(
    { channelLogin, limit: GAP_LIMIT, after: sinceMs - GAP_MARGIN_MS },
    { silent: true },
  )
    .then((msgs) => {
      const items = msgs.map((m) => mapChatMessage(m, m.timestamp_ms));
      noteChatters(broadcasterId, insertEntries(broadcasterId, items));
      // A full page means robotty dropped the oldest messages of the gap;
      // it keeps the newest `limit`, so the hole sits before the first one.
      if (msgs.length >= GAP_LIMIT) {
        insertEntries(broadcasterId, [
          feedEvent(
            "local",
            "Some messages may be missing here",
            msgs[0].timestamp_ms - 1,
            { silent: true },
          ),
        ]);
      }
    })
    .catch((e) => console.error("[feeds] gap fill failed", channelLogin, e));
}

/// One-time hydration of a channel feed with recent history from robotty.
/// The `backfilled` flag in `ChannelFeed` prevents repeats across remounts;
/// a failed fetch leaves it unset so the next visit tries again.
export function load(broadcasterId: string, channelLogin: string) {
  if (feeds[broadcasterId]?.backfilled) return;
  getRecentMessages({ channelLogin, limit: MESSAGE_CAP }, { silent: true })
    .then((msgs) => {
      const items = msgs.map((m) => mapChatMessage(m, m.timestamp_ms));
      const added = prependEntries(broadcasterId, items);
      noteChatters(broadcasterId, added);
      rememberOwnMessages(broadcasterId, added);
    })
    .catch((e) => {
      appendItem(
        broadcasterId,
        feedEvent(
          "local",
          `Couldn't load recent history: ${errorMessage(e)}`,
          Date.now(),
          { id: `backlog-failed-${broadcasterId}`, silent: true },
        ),
      );
    });
}

/// For a user card whose chatter has nothing in the live feed: robotty's
/// deepest page, narrowed to that chatter, held by the card and not the feed.
export function forChatter(
  channelLogin: string,
  chatterId: string,
): Promise<FeedMessage[]> {
  return getRecentMessages({ channelLogin, limit: CHATTER_LIMIT }, {
    silent: true,
  }).then((msgs) =>
    msgs
      .filter((m) => m.chatter_user_id === chatterId)
      .map((m) => mapChatMessage(m, m.timestamp_ms))
  );
}

/// Newest first, so the newest backlog entry lands just behind anything
/// already in the sent history.
function rememberOwnMessages(broadcasterId: string, added: FeedEntry[]) {
  const me = user();
  if (!me) return;
  for (let i = added.length - 1; i >= 0; i--) {
    const it = added[i];
    if (it.kind !== "message" || it.chatter_user_id !== me.id) continue;
    const text = textOf(it);
    if (text) appendSentHistoryOlder(broadcasterId, text);
  }
}
