import { listen } from "@tauri-apps/api/event";
import type {
  FeedEvent,
  FeedMessage,
  Fragment,
  RawAutomodMessageHold,
  RawChatMessageDelete,
  RawChatClear,
  RawChatClearUserMessages,
  RawModerate,
} from "../types/index.ts";
import type { EventEnvelope } from "../types/twitch/eventsub.ts";
import {
  appendItem,
  markMessageDeleted,
  markUserMessagesDeleted,
  markAllMessagesDeleted,
} from "../stores/feeds.ts";
import { isModOfChannel } from "../stores/users.ts";

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

listen<EventEnvelope<RawChatMessageDelete>>("channel-chat-message-delete", (e) => {
  const raw = e.payload.event;
  markMessageDeleted(raw.broadcaster_user_id, raw.message_id);
});

listen<EventEnvelope<RawChatClearUserMessages>>("channel-chat-clear-user-messages", (e) => {
  const raw = e.payload.event;
  markUserMessagesDeleted(raw.broadcaster_user_id, raw.target_user_id);
});

listen<EventEnvelope<RawChatClear>>("channel-chat-clear", (e) => {
  const broadcasterId = e.payload.event.broadcaster_user_id;
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

listen<EventEnvelope<RawModerate>>("channel-moderate", (e) => {
  const payload = e.payload.event;
  const serverNowMs = new Date(e.payload.timestamp).getTime();
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

function mapAutomodFragment(f: RawAutomodMessageHold["message"]["fragments"][number]): Fragment {
  if (f.type === "emote") return { type: "emote", text: f.text, id: f.emote.id };
  if (f.type === "cheermote") return { type: "cheermote", text: f.text };
  return { type: "text", text: f.text };
}

function automodReasonLabel(p: RawAutomodMessageHold): string {
  if (p.reason === "blocked_term") return "Blocked term";
  return `AutoMod: ${p.automod.category} (level ${p.automod.level})`;
}

listen<EventEnvelope<RawAutomodMessageHold>>("automod-message-hold", (e) => {
  const p = e.payload.event;
  const item: FeedMessage = {
    kind: "message",
    message_id: p.message_id,
    chatter_user_id: p.user_id,
    chatter_login: p.user_login,
    chatter_name: p.user_name,
    color: "",
    fragments: p.message.fragments.map(mapAutomodFragment),
    badges: [],
    timestamp: new Date(p.held_at).getTime() || Date.now(),
    automod_hold: {
      reason: automodReasonLabel(p),
      status: "pending",
      broadcaster_user_id: p.broadcaster_user_id,
    },
  };
  appendItem(p.broadcaster_user_id, item);
});
