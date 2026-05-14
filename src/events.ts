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
  RawModerate,
  RawModerateEvent,
} from "./types";
import {
  appendItem,
  markMessageDeleted,
  markUserMessagesDeleted,
  markAllMessagesDeleted,
} from "./components/feed/feeds";
import { user, isModOfChannel } from "./state/users";
import { channelsById } from "./state/channels";
import { recordMention } from "./state/inbox";
import { feedKeywords, matchesAnyKeyword } from "./state/preferences";
import { getChannelFollowers } from "./commands/channels";
import { sendChatMessage } from "./commands/chat";

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

export function mapChatMessage(raw: RawChatMessage, timestamp: number): FeedMessage {
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
    deleted: raw.deleted,
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

async function handleFollowageCommand(raw: RawChatMessage) {
  try {
    const res = await getChannelFollowers(
      { broadcasterId: raw.broadcaster_user_id, userId: raw.chatter_user_id, first: 1 },
      { silent: true },
    );
    const follower = res.data[0];
    const message = follower
      ? `You have been following since ${new Date(follower.followed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
      : `You are not following yet`;
    await sendChatMessage({
      broadcasterId: raw.broadcaster_user_id,
      message,
      replyParentMessageId: raw.message_id,
    });
  } catch {
    /* ignore */
  }
}

listen<RawChatMessage>("channel-chat-message", (e) => {
  const raw = e.payload;
  const ts = Date.now();
  appendItem(raw.broadcaster_user_id, mapChatMessage(raw, ts));

  if (
    user()?.id === "52679773" &&
    raw.message.text.trim().toLowerCase() === "!followage" &&
    isModOfChannel(raw.broadcaster_user_id)
  ) {
    handleFollowageCommand(raw);
  }

  const me = user();
  if (!me || raw.chatter_user_id === me.id) return;
  const myLogin = me.login.toLowerCase();
  const isMention = raw.message.fragments.some(
    (f) => f.type === "mention" && f.mention.user_login.toLowerCase() === myLogin,
  );
  const keywordHit = matchesAnyKeyword(raw.message.text, feedKeywords());
  if (!isMention && !keywordHit) return;

  const ch = channelsById.get(raw.broadcaster_user_id);
  recordMention({
    id: raw.message_id,
    channelId: raw.broadcaster_user_id,
    channelLogin: ch?.user_login ?? raw.broadcaster_user_id,
    channelName: ch?.user_name ?? raw.broadcaster_user_id,
    messageId: raw.message_id,
    chatterId: raw.chatter_user_id,
    chatterLogin: raw.chatter_user_login,
    chatterName: raw.chatter_user_name,
    chatterColor: raw.color,
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
  const broadcasterId = e.payload.broadcaster_user_id;
  markAllMessagesDeleted(broadcasterId);
  if (isModOfChannel(broadcasterId)) return;
  const now = Date.now();
  const notice: FeedEvent = {
    kind: "event",
    id: `chat-cleared-${broadcasterId}-${now}`,
    notice_type: "chat_cleared",
    system_message: "Chat has been cleared by a moderator.",
    chatter_name: "",
    color: "",
    timestamp: now,
  };
  appendItem(broadcasterId, notice);
});

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  if (seconds >= 86400) return `${Math.round(seconds / 86400)}d`;
  if (seconds >= 3600) return `${Math.round(seconds / 3600)}h`;
  if (seconds >= 60) return `${Math.round(seconds / 60)}m`;
  return `${seconds}s`;
}

function buildModerateMessage(p: RawModerate, serverNowMs: number): string | null {
  const mod = p.moderator_user_name;
  switch (p.action) {
    case "clear":
      return `${mod} cleared the chat`;
    case "ban": {
      const r = p.ban.reason ? `: ${p.ban.reason}` : "";
      return `${mod} banned ${p.ban.user_name}${r}`;
    }
    case "unban":
      return `${mod} unbanned ${p.unban.user_name}`;
    case "timeout": {
      const secs = Math.max(0, Math.ceil((new Date(p.timeout.expires_at).getTime() - serverNowMs) / 1000));
      const r = p.timeout.reason ? `: ${p.timeout.reason}` : "";
      return `${mod} timed out ${p.timeout.user_name} for ${formatDuration(secs)}${r}`;
    }
    case "untimeout":
      return `${mod} removed timeout on ${p.untimeout.user_name}`;
    case "delete":
      return `${mod} deleted message from ${p.delete.user_name} saying: ${p.delete.message_body}`;
    case "mod":
      return `${mod} added ${p.mod.user_name} as a moderator`;
    case "unmod":
      return `${mod} removed ${p.unmod.user_name} as a moderator`;
    case "vip":
      return `${mod} added ${p.vip.user_name} as a VIP`;
    case "unvip":
      return `${mod} removed ${p.unvip.user_name} as a VIP`;
    case "raid":
      return `${mod} initiated a raid on ${p.raid.user_name}`;
    case "unraid":
      return `${mod} cancelled the raid`;
    case "slow":
      return `${mod} enabled slow mode (${p.slow.wait_time_seconds}s)`;
    case "slowoff":
      return `${mod} disabled slow mode`;
    case "followers":
      return `${mod} enabled followers-only mode (${p.followers.follow_duration_minutes}m)`;
    case "followersoff":
      return `${mod} disabled followers-only mode`;
    case "emoteonly":
      return `${mod} enabled emote-only mode`;
    case "emoteonlyoff":
      return `${mod} disabled emote-only mode`;
    case "subscribers":
      return `${mod} enabled subscribers-only mode`;
    case "subscribersoff":
      return `${mod} disabled subscribers-only mode`;
    case "uniquechat":
      return `${mod} enabled unique-chat mode`;
    case "uniquechatoff":
      return `${mod} disabled unique-chat mode`;
    case "warn": {
      const r = p.warn.reason ? `: ${p.warn.reason}` : "";
      return `${mod} warned ${p.warn.user_name}${r}`;
    }
  }
}

listen<RawModerateEvent>("channel-moderate", (e) => {
  const payload = e.payload.event;
  const serverNowMs = new Date(e.payload.message_timestamp).getTime();
  const msg = buildModerateMessage(payload, serverNowMs);
  if (!msg) return;
  const now = Date.now();
  const notice: FeedEvent = {
    kind: "event",
    id: `moderate-${payload.broadcaster_user_id}-${payload.action}-${now}-${Math.random().toString(36).slice(2, 8)}`,
    notice_type: `moderate_${payload.action}`,
    system_message: msg,
    chatter_name: payload.moderator_user_name,
    color: "",
    timestamp: now,
  };
  appendItem(payload.broadcaster_user_id, notice);
});

listen<string>("eventsub-error", (e) => {
  console.error("EventSub error:", e.payload);
});
