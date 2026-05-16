import { listen } from "@tauri-apps/api/event";
import { appendItem } from "../state/feeds";
import type { FeedEvent } from "../types/feed";
import type { EventKind } from "../types/eventsub";

type Payload = { broadcaster_id: string; kind: EventKind };
type FailedPayload = Payload & { error: string };

const CHAT = "channel.chat.message" as const;

function pushNotice(broadcasterId: string, noticeType: string, message: string): void {
  const now = Date.now();
  const notice: FeedEvent = {
    kind: "event",
    id: `${noticeType}-${broadcasterId}-${now}-${Math.random().toString(36).slice(2, 8)}`,
    notice_type: noticeType,
    system_message: message,
    chatter_name: "",
    color: "",
    timestamp: now,
  };
  appendItem(broadcasterId, notice);
}

listen<Payload>("eventsub-subscribed", (e) => {
  if (e.payload.kind !== CHAT) return;
  pushNotice(e.payload.broadcaster_id, "chat_connected", "Connected to chat");
});

listen<Payload>("eventsub-unsubscribed", (e) => {
  if (e.payload.kind !== CHAT) return;
  pushNotice(e.payload.broadcaster_id, "chat_disconnected", "Disconnected from chat");
});

listen<FailedPayload>("eventsub-subscribe-failed", (e) => {
  if (e.payload.kind !== CHAT) return;
  pushNotice(
    e.payload.broadcaster_id,
    "chat_connect_failed",
    `Failed to connect to chat: ${e.payload.error}`,
  );
});
