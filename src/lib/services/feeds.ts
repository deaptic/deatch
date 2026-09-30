import { getRecentMessages } from "../api/twitch/chat.ts";
import { mapChatMessage } from "../events/chat-mapper.ts";
import {
  appendItem,
  feeds,
  insertItems,
  prependItems,
} from "../stores/feeds.ts";

const GAP_MARGIN_MS = 5_000;
const GAP_LIMIT = 300;

/// Backfills messages that arrived while the EventSub socket was down.
/// Pulls from `since` minus a margin; duplicates are dropped on insert.
export function fillGap(
  broadcasterId: string,
  channelLogin: string,
  sinceMs: number,
) {
  getRecentMessages(
    { channelLogin, limit: GAP_LIMIT, after: sinceMs - GAP_MARGIN_MS },
    { silent: true },
  )
    .then((msgs) => {
      const items = msgs.map((m) => mapChatMessage(m, m.timestamp_ms));
      insertItems(broadcasterId, items);
    })
    .catch((e) => console.error("[feeds] gap fill failed", channelLogin, e));
}

/// One-time hydration of a channel feed with recent history from robotty.
/// The `backfilled` flag in `ChannelFeed` prevents repeats across remounts;
/// a failed fetch leaves it unset so the next visit tries again.
export function loadBacklog(broadcasterId: string, channelLogin: string) {
  if (feeds[broadcasterId]?.backfilled) return;
  getRecentMessages({ channelLogin, limit: 50 }, { silent: true })
    .then((msgs) => {
      const items = msgs.map((m) => mapChatMessage(m, m.timestamp_ms));
      prependItems(broadcasterId, items);
    })
    .catch((e) => {
      appendItem(broadcasterId, {
        kind: "event",
        id: `backlog-failed-${broadcasterId}`,
        notice_type: "local",
        system_message: `Couldn't load recent history: ${String(e)}`,
        chatter_name: "",
        color: "",
        timestamp: Date.now(),
        silent: true,
      });
    });
}

/// Scrolls a rendered message into view and briefly highlights it. Relies
/// on FeedMessage rendering a `data-message-id` attribute on each row.
export function scrollToMessage(messageId: string) {
  const el = document.querySelector(`[data-message-id="${messageId}"]`) as
    | HTMLElement
    | null;
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.style.backgroundColor =
    "color-mix(in oklab, var(--color-accent) 30%, transparent)";
  const clear = () => {
    el.style.transition = "background-color var(--duration-settle) ease";
    el.style.backgroundColor = "";
    el.removeEventListener("mouseenter", clear);
  };
  el.addEventListener("mouseenter", clear);
}
