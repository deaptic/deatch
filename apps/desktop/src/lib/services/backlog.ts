import { getRecentMessages } from "../api/twitch/chat.ts";
import { chatterOf, mapChatMessage } from "../events/chat-mapper.ts";
import { errorMessage } from "../utils/error.ts";
import { textOf } from "../utils/message.ts";
import {
  appendItem,
  type FeedEntry,
  feeds,
  insertEntries,
  prependEntries,
} from "../stores/feeds.ts";
import { recordChatter, user } from "../stores/users.ts";
import { appendSentHistoryOlder } from "../stores/chatHistory.ts";

const GAP_MARGIN_MS = 5_000;
const GAP_LIMIT = 300;

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
    })
    .catch((e) => console.error("[feeds] gap fill failed", channelLogin, e));
}

/// One-time hydration of a channel feed with recent history from robotty.
/// The `backfilled` flag in `ChannelFeed` prevents repeats across remounts;
/// a failed fetch leaves it unset so the next visit tries again.
export function load(broadcasterId: string, channelLogin: string) {
  if (feeds[broadcasterId]?.backfilled) return;
  getRecentMessages({ channelLogin, limit: 50 }, { silent: true })
    .then((msgs) => {
      const items = msgs.map((m) => mapChatMessage(m, m.timestamp_ms));
      const added = prependEntries(broadcasterId, items);
      noteChatters(broadcasterId, added);
      rememberOwnMessages(broadcasterId, added);
    })
    .catch((e) => {
      appendItem(broadcasterId, {
        kind: "event",
        id: `backlog-failed-${broadcasterId}`,
        notice_type: "local",
        system_message: `Couldn't load recent history: ${errorMessage(e)}`,
        chatter_name: "",
        color: "",
        timestamp: Date.now(),
        silent: true,
      });
    });
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
