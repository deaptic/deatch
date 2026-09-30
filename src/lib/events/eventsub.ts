import { listen } from "@tauri-apps/api/event";
import { appendItem } from "../stores/feeds.ts";
import { usersById } from "../stores/channels.ts";
import { setChatConnected } from "../stores/eventsub.ts";
import { fillGap } from "../services/feeds.ts";
import type { FeedEvent } from "../types/feed.ts";
import type {
  EventSubConnection,
  EventSubFailure,
  EventSubNotice,
  EventSubRecovered,
} from "../types/twitch/eventsub.ts";

const CHAT = "channel.chat.message" as const;

function pushNotice(
  broadcasterId: string,
  noticeType: string,
  message: string,
): void {
  const now = Date.now();
  const notice: FeedEvent = {
    kind: "event",
    id: `${noticeType}-${broadcasterId}-${now}-${
      Math.random().toString(36).slice(2, 8)
    }`,
    notice_type: noticeType,
    system_message: message,
    chatter_name: "",
    color: "",
    timestamp: now,
    silent: true,
  };
  appendItem(broadcasterId, notice);
}

listen<EventSubNotice>("eventsub-subscribed", (e) => {
  if (e.payload.kind !== CHAT) return;
  pushNotice(e.payload.broadcaster_id, "chat_connected", "Connected to chat");
});

listen<EventSubNotice>("eventsub-unsubscribed", (e) => {
  if (e.payload.kind !== CHAT) return;
  pushNotice(
    e.payload.broadcaster_id,
    "chat_disconnected",
    "Disconnected from chat",
  );
});

listen<EventSubConnection>("eventsub-connection", (e) => {
  setChatConnected(e.payload.connected);
});

listen<EventSubRecovered>("eventsub-recovered", (e) => {
  for (const id of e.payload.broadcaster_ids) {
    const login = usersById.get(id)?.login;
    if (login) fillGap(id, login, e.payload.since);
  }
});

listen<EventSubFailure>("eventsub-subscribe-failed", (e) => {
  if (e.payload.kind !== CHAT) return;
  pushNotice(
    e.payload.broadcaster_id,
    "chat_connect_failed",
    `Failed to connect to chat: ${e.payload.error}`,
  );
});
