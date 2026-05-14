import { listen } from "@tauri-apps/api/event";
import type { FeedEvent, RawNotification, RawShoutout, RawFollow } from "../types";
import { appendItem } from "../state/feeds";

function mapNotice(raw: RawNotification, timestamp: number): FeedEvent {
  return {
    kind: "event",
    id: crypto.randomUUID(),
    notice_type: raw.notice_type,
    system_message: raw.system_message,
    chatter_user_id: raw.chatter_is_anonymous ? undefined : raw.chatter_user_id,
    chatter_name: raw.chatter_user_name ?? "anonymous",
    color: raw.color ?? "",
    timestamp,
  };
}

function mapShoutout(raw: RawShoutout, timestamp: number): FeedEvent {
  return {
    kind: "event",
    id: crypto.randomUUID(),
    notice_type: "shoutout",
    system_message: `Shoutout to ${raw.to_broadcaster_user_name}!`,
    chatter_name: raw.moderator_user_name,
    color: "",
    timestamp,
  };
}

function mapFollow(raw: RawFollow, timestamp: number): FeedEvent {
  return {
    kind: "event",
    id: crypto.randomUUID(),
    notice_type: "follow",
    system_message: `${raw.user_name} followed!`,
    chatter_user_id: raw.user_id,
    chatter_name: raw.user_name,
    color: "",
    timestamp,
  };
}

listen<RawNotification>("channel-chat-notification", (e) => {
  const id = e.payload.broadcaster_user_id;
  if (!e.payload.system_message?.trim()) return;
  const item = mapNotice(e.payload, Date.now());
  if (e.payload.notice_type === "sub_gift") {
    setTimeout(() => appendItem(id, item), 600);
  } else {
    appendItem(id, item);
  }
});

listen<RawShoutout>("channel-shoutout-create", (e) => {
  appendItem(e.payload.broadcaster_user_id, mapShoutout(e.payload, Date.now()));
});

listen<RawFollow>("channel-follow", (e) => {
  appendItem(e.payload.broadcaster_user_id, mapFollow(e.payload, Date.now()));
});
