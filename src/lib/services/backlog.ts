import { getRecentMessages } from "../api/twitch/chat.ts";
import { mapChatMessage } from "../events/chat-mapper.ts";
import { errorMessage } from "../utils/error.ts";
import {
  appendItem,
  feeds,
  insertEntries,
  prependEntries,
} from "../stores/feeds.ts";

const GAP_MARGIN_MS = 5_000;
const GAP_LIMIT = 300;

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
      insertEntries(broadcasterId, items);
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
      prependEntries(broadcasterId, items);
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
