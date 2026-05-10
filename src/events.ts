import { listen } from "@tauri-apps/api/event";
import type { FeedMessage, FeedEvent, Fragment } from "./components/feed/types";
import type { RawFragment, RawChatMessage, RawNotification, RawShoutout, RawFollow } from "./types";
import { appendItem } from "./components/feed/feeds";

const CHANNEL_POINT_TYPES = new Set([
  "channel_points_highlighted",
  "channel_points_sub_only",
  "power_ups_message_effect",
  "power_ups_gigantified_emote",
]);

function mapFragment(f: RawFragment): Fragment {
  switch (f.type) {
    case "emote":
      return { type: "emote", text: f.text, id: f.emote.id };
    case "mention":
      return { type: "mention", text: f.text, user_login: f.mention.user_login };
    case "cheermote":
      return { type: "cheermote", text: f.text };
    default:
      return { type: "text", text: f.text };
  }
}

function mapChatMessage(raw: RawChatMessage, timestamp: number): FeedMessage {
  return {
    kind: "message",
    message_id: raw.message_id,
    chatter_user_id: raw.chatter_user_id,
    chatter_login: raw.chatter_user_login,
    chatter_name: raw.chatter_user_name,
    color: raw.color,
    fragments: raw.message.fragments.map(mapFragment),
    badges: raw.badges,
    reply: raw.reply ?? undefined,
    timestamp,
    channel_points:
      !!raw.channel_points_custom_reward_id || CHANNEL_POINT_TYPES.has(raw.message_type),
    first_message: raw.message_type === "user_intro",
  };
}

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

listen<RawChatMessage>("channel-chat-message", (e) => {
  appendItem(e.payload.broadcaster_user_id, mapChatMessage(e.payload, Date.now()));
});

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

listen<string>("chat-error", (e) => {
  console.error("Chat error:", e.payload);
});
