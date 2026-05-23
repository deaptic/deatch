import { getRecentMessages } from "../commands/twitch/chat";
import { mapChatMessage } from "../events/chat-mapper";
import { feeds, prependItems } from "../state/feeds";

/// One-time hydration of a channel feed with recent history from robotty.
/// The `backfilled` flag in `ChannelFeed` prevents repeats across remounts.
export function loadBacklog(broadcasterId: string, channelLogin: string) {
  if (feeds[broadcasterId]?.backfilled) return;
  getRecentMessages({ channelLogin, limit: 50 }, { silent: true })
    .then((msgs) => {
      const items = msgs.map((m) => mapChatMessage(m, m.timestamp_ms));
      prependItems(broadcasterId, items);
    })
    .catch(() => {
      // Mark backfilled even on failure so we don't retry on every remount.
      prependItems(broadcasterId, []);
    });
}

/// Scrolls a rendered message into view and briefly highlights it. Relies
/// on FeedMessage rendering a `data-message-id` attribute on each row.
export function scrollToMessage(messageId: string) {
  const el = document.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement | null;
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.style.backgroundColor = "color-mix(in oklab, var(--color-primary) 35%, transparent)";
  const clear = () => {
    el.style.transition = "background-color 0.3s ease";
    el.style.backgroundColor = "";
    el.removeEventListener("mouseenter", clear);
  };
  el.addEventListener("mouseenter", clear);
}
