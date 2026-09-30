import { events } from "../bindings.ts";
import { appendItem } from "../stores/feeds.ts";
import { usersById } from "../stores/channels.ts";
import { setChatConnected } from "../stores/eventsub.ts";
import { fillGap } from "../services/feeds.ts";
import type { FeedEvent } from "../types/feed.ts";

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

events.eventSubSubscription.listen(({ payload }) => {
  if (payload.kind !== CHAT) return;
  const { broadcasterId, status } = payload;
  switch (status.type) {
    case "subscribed":
      pushNotice(broadcasterId, "chat_connected", "Connected to chat");
      break;
    case "unsubscribed":
      pushNotice(broadcasterId, "chat_disconnected", "Disconnected from chat");
      break;
    case "failed":
      pushNotice(
        broadcasterId,
        "chat_connect_failed",
        `Failed to connect to chat: ${status.error}`,
      );
      break;
  }
});

events.eventSubConnection.listen((e) => {
  setChatConnected(e.payload.connected);
});

events.eventSubRecovered.listen((e) => {
  for (const id of e.payload.broadcasterIds) {
    const login = usersById.get(id)?.login;
    if (login) fillGap(id, login, e.payload.since);
  }
});
