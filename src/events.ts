import { listen } from "@tauri-apps/api/event";
import type { FeedMessage, FeedEvent, Fragment } from "./components/feed/types";
import type {
  RawFragment,
  RawChatMessage,
  RawNotification,
  RawShoutout,
  RawFollow,
  RawChatMessageDelete,
  RawChatClear,
  RawChatClearUserMessages,
} from "./types";
import {
  appendItem,
  markMessageDeleted,
  markUserMessagesDeleted,
  markAllMessagesDeleted,
} from "./components/feed/feeds";
import { user } from "./state/users";
import { channelsById } from "./state/channels";
import { recordMention } from "./state/inbox";

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
  const raw = e.payload;
  const ts = Date.now();
  appendItem(raw.broadcaster_user_id, mapChatMessage(raw, ts));

  const me = user();
  if (!me || raw.chatter_user_id === me.user_id) return;
  const myLogin = me.login.toLowerCase();
  const isMention = raw.message.fragments.some(
    (f) => f.type === "mention" && f.mention.user_login.toLowerCase() === myLogin,
  );
  if (!isMention) return;

  const ch = channelsById.get(raw.broadcaster_user_id);
  recordMention({
    id: raw.message_id,
    channelId: raw.broadcaster_user_id,
    channelLogin: ch?.user_login ?? raw.broadcaster_user_id,
    channelName: ch?.user_name ?? raw.broadcaster_user_id,
    messageId: raw.message_id,
    chatterLogin: raw.chatter_user_login,
    chatterName: raw.chatter_user_name,
    chatterColor: raw.color,
    chatterAvatar: "",
    message: raw.message.text,
    timestamp: ts,
  });
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

listen<RawChatMessageDelete>("channel-chat-message-delete", (e) => {
  markMessageDeleted(e.payload.broadcaster_user_id, e.payload.message_id);
});

listen<RawChatClearUserMessages>("channel-chat-clear-user-messages", (e) => {
  markUserMessagesDeleted(e.payload.broadcaster_user_id, e.payload.target_user_id);
});

listen<RawChatClear>("channel-chat-clear", (e) => {
  markAllMessagesDeleted(e.payload.broadcaster_user_id);
});

listen<string>("chat-error", (e) => {
  console.error("Chat error:", e.payload);
});
