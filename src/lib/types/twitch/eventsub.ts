// EventSub subscription kinds + the envelope wrapping every event the
// backend forwards from Twitch's WebSocket. The `Raw*` types below describe
// the helix-shaped payloads that arrive as the inner `T` of the envelope —
// they live here (rather than in `dto/twitch/eventsub.rs`) because the
// backend re-emits helix types as-is, so the frontend owns the wire spec.

export type EventKind =
  | "channel.chat.message"
  | "channel.chat.notification"
  | "channel.chat.message_delete"
  | "channel.chat.clear"
  | "channel.chat.clear_user_messages"
  | "channel.shoutout.create"
  | "channel.follow"
  | "channel.moderate"
  | "automod.message.hold"
  | "channel.channel_points_custom_reward_redemption.add";

export const CHAT_KINDS: EventKind[] = [
  "channel.chat.message",
  "channel.chat.notification",
  "channel.chat.message_delete",
  "channel.chat.clear",
  "channel.chat.clear_user_messages",
];

export const MOD_KINDS: EventKind[] = [
  "channel.shoutout.create",
  "channel.follow",
  "channel.moderate",
  "automod.message.hold",
];

// Broadcaster-only — only subscribable for the logged-in user's own channel.
export const OWN_KINDS: EventKind[] = [
  "channel.channel_points_custom_reward_redemption.add",
];

export const ALL_KINDS: EventKind[] = [...CHAT_KINDS, ...MOD_KINDS, ...OWN_KINDS];

/// Per-channel subscription status tracked by the EventSubManager.
export type SubStatus = "pending" | "active" | "failed" | "disconnected";

export type EventEnvelope<T> = {
  timestamp: string;
  event: T;
};

// ── channel.chat.message ──────────────────────────────────────────────

export type RawFragment =
  | { type: "text"; text: string }
  | { type: "emote"; text: string; emote: { id: string } }
  | { type: "mention"; text: string; mention: { user_login: string } }
  | { type: "cheermote"; text: string; cheermote: unknown };

type RawReply = {
  parent_message_id: string;
  parent_message_body: string;
  parent_user_name: string;
  parent_user_login: string;
};

/// A chat-message badge tag (`{set_id, id, info}`). Distinct from the
/// resource-shape `Badge` in `./chat` (which has image URLs).
export type MessageBadge = {
  set_id: string;
  id: string;
  info: string;
};

export type RawChatMessage = {
  broadcaster_user_id: string;
  message_id: string;
  chatter_user_id: string;
  chatter_user_login: string;
  chatter_user_name: string;
  color: string;
  message: { text: string; fragments: RawFragment[] };
  message_type: string;
  badges: MessageBadge[];
  reply: RawReply | null;
  channel_points_custom_reward_id: string | null;
  /// Synthetic field set by the robotty backlog mapper when a CLEARMSG /
  /// CLEARCHAT in the same window targets this message. EventSub messages
  /// never carry this — they use a separate delete event.
  deleted?: boolean;
};

// ── channel.chat.notification / shoutout / follow ────────────────────

export type RawNotification = {
  broadcaster_user_id: string;
  notice_type: string;
  system_message: string;
  chatter_is_anonymous?: boolean;
  chatter_user_id?: string;
  chatter_user_name?: string;
  color?: string;
};

export type RawShoutout = {
  broadcaster_user_id: string;
  to_broadcaster_user_name: string;
  moderator_user_name: string;
};

export type RawFollow = {
  broadcaster_user_id: string;
  user_id: string;
  user_name: string;
};

// ── channel.channel_points_custom_reward_redemption.add ──────────────

export type RawChannelPointsRedemption = {
  broadcaster_user_id: string;
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  user_input: string;
  status: "unknown" | "unfulfilled" | "fulfilled" | "canceled";
  reward: {
    id: string;
    title: string;
    cost: number;
    prompt: string;
  };
  redeemed_at: string;
};

// ── channel.chat.message_delete / clear / clear_user_messages ────────

export type RawChatMessageDelete = {
  broadcaster_user_id: string;
  message_id: string;
  target_user_id: string;
  target_user_login: string;
  target_user_name: string;
};

export type RawChatClear = {
  broadcaster_user_id: string;
};

export type RawChatClearUserMessages = {
  broadcaster_user_id: string;
  target_user_id: string;
  target_user_login: string;
  target_user_name: string;
};

// ── channel.moderate ─────────────────────────────────────────────────

type RawModerateBase = {
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  moderator_user_id: string;
  moderator_user_login: string;
  moderator_user_name: string;
};

type RawModUser = { user_id: string; user_login: string; user_name: string };

export type RawModerate = RawModerateBase &
  (
    | { action: "clear" }
    | { action: "ban"; ban: RawModUser & { reason: string | null } }
    | { action: "unban"; unban: RawModUser }
    | { action: "timeout"; timeout: RawModUser & { reason: string | null; expires_at: string } }
    | { action: "untimeout"; untimeout: RawModUser }
    | { action: "delete"; delete: RawModUser & { message_id: string; message_body: string } }
    | { action: "mod"; mod: RawModUser }
    | { action: "unmod"; unmod: RawModUser }
    | { action: "vip"; vip: RawModUser }
    | { action: "unvip"; unvip: RawModUser }
    | { action: "raid"; raid: RawModUser & { viewer_count: number } }
    | { action: "unraid"; unraid: RawModUser }
    | { action: "slow"; slow: { wait_time_seconds: number } }
    | { action: "slowoff" }
    | { action: "followers"; followers: { follow_duration_minutes: number } }
    | { action: "followersoff" }
    | { action: "emoteonly" }
    | { action: "emoteonlyoff" }
    | { action: "subscribers" }
    | { action: "subscribersoff" }
    | { action: "uniquechat" }
    | { action: "uniquechatoff" }
    | { action: "warn"; warn: RawModUser & { reason: string | null } }
  );

// ── automod.message.hold ─────────────────────────────────────────────

export type AutomodHeldReason =
  | {
      reason: "automod";
      automod: { category: string; level: number; boosts_immunity: boolean };
    }
  | {
      reason: "blocked_term";
      blocked_term: {
        terms_found: { term_id: string; boundary: { start_pos: number; end_pos: number } }[];
      };
    };

type RawAutomodFragment =
  | { type: "text"; text: string }
  | { type: "emote"; text: string; emote: { id: string; emote_set_id: string } }
  | {
      type: "cheermote";
      text: string;
      cheermote: { prefix: string; bits: number; tier: number };
    };

export type RawAutomodMessageHold = {
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  user_id: string;
  user_login: string;
  user_name: string;
  message_id: string;
  message: { text: string; fragments: RawAutomodFragment[] };
  held_at: string;
} & AutomodHeldReason;
