// The envelope wrapping every event the backend forwards from Twitch's
// WebSocket. The `Raw*` types below describe the helix-shaped payloads that
// arrive as the inner `T` of the envelope — they live here (rather than in
// `dto/twitch/eventsub.rs`) because the backend re-emits helix types as-is,
// so the frontend owns the wire spec.

import type { EventKind } from "../../bindings.ts";

export type { EventKind };

export type EventEnvelope<T> = {
  timestamp: string;
  event: T;
};

// channel.chat.message
export type RawFragment =
  | { type: "text"; text: string }
  | { type: "emote"; text: string; emote: { id: string } }
  | { type: "mention"; text: string; mention: { user_login: string } }
  | { type: "cheermote"; text: string; cheermote: RawCheermote };

type RawCheermote = { prefix: string; bits: number; tier: number };

type RawReply = {
  parent_message_id: string;
  parent_message_body: string;
  parent_user_name: string;
  parent_user_login: string;
  parent_user_id: string;
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
  cheer?: { bits: number } | null;
  /// Set only during shared chat, on every message including local ones.
  source_broadcaster_user_id?: string | null;
  source_broadcaster_user_login?: string | null;
  source_broadcaster_user_name?: string | null;
  source_message_id?: string | null;
  source_badges?: MessageBadge[] | null;
  /// Synthetic field set by the robotty backlog mapper when a CLEARMSG /
  /// CLEARCHAT in the same window targets this message. EventSub messages
  /// never carry this — they use a separate delete event.
  deleted?: boolean;
};

// channel.chat.notification / shoutout / follow
type SubTier = "1000" | "2000" | "3000";

type Gifter = {
  gifter_is_anonymous: boolean;
  gifter_user_name: string | null;
};

export type RawNoticeDetails = {
  sub: { sub_tier: SubTier; is_prime: boolean };
  resub: {
    sub_tier: SubTier;
    is_prime: boolean | null;
    cumulative_months: number;
    streak_months: number | null;
  };
  sub_gift: {
    sub_tier: SubTier;
    recipient_user_name: string;
    cumulative_total: number | null;
  };
  community_sub_gift: {
    sub_tier: SubTier;
    total: number;
    cumulative_total: number | null;
  };
  gift_paid_upgrade: Gifter;
  prime_paid_upgrade: { sub_tier: SubTier };
  pay_it_forward: Gifter;
  raid: { user_name: string; viewer_count: number };
  bits_badge_tier: { tier: number };
  charity_donation: {
    charity_name: string;
    amount: { value: number; decimal_place: number; currency: string };
  };
};

export type RawNotification =
  & {
    broadcaster_user_id: string;
    message_id: string;
    notice_type: string;
    system_message: string;
    /// The chatter's own text, e.g. a resub message or an announcement.
    message?: { text: string; fragments: RawFragment[] };
    chatter_is_anonymous?: boolean;
    chatter_user_id?: string;
    chatter_user_login?: string;
    chatter_user_name?: string;
    color?: string;
  }
  & { [K in keyof RawNoticeDetails]?: RawNoticeDetails[K] | null }
  & {
    [K in keyof RawNoticeDetails as `shared_chat_${K}`]?:
      | RawNoticeDetails[K]
      | null;
  };

export type RawShoutout = {
  broadcaster_user_id: string;
  to_broadcaster_user_name: string;
  moderator_user_name: string;
};

export type RawShoutoutReceive = {
  broadcaster_user_id: string;
  from_broadcaster_user_id: string;
  from_broadcaster_user_login: string;
  from_broadcaster_user_name: string;
  viewer_count: number;
};

export type RawFollow = {
  broadcaster_user_id: string;
  user_id: string;
  user_login: string;
  user_name: string;
};

// channel.channel_points_custom_reward_redemption.add
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

// channel.channel_points_automatic_reward_redemption.add v2
export type RawAutomaticRedemption = {
  broadcaster_user_id: string;
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  reward: {
    type: string;
    channel_points: number;
    emote: { id: string; name: string } | null;
  };
  message: { text: string; fragments: RawFragment[] } | null;
  redeemed_at: string;
};

// channel.chat.message_delete / clear / clear_user_messages
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

// channel.chat_settings.update
export type RawChatSettingsUpdate = {
  broadcaster_user_id: string;
  emote_mode: boolean;
  follower_mode: boolean;
  follower_mode_duration_minutes: number | null;
  slow_mode: boolean;
  slow_mode_wait_time_seconds: number | null;
  subscriber_mode: boolean;
  unique_chat_mode: boolean;
};

// channel.moderate
type RawModerateBase = {
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  moderator_user_id: string;
  moderator_user_login: string;
  moderator_user_name: string;
  /// The shared chat channel the action happened in; null when it was here.
  source_broadcaster_user_id?: string | null;
  source_broadcaster_user_name?: string | null;
};

type RawModUser = { user_id: string; user_login: string; user_name: string };
type RawBan = RawModUser & { reason: string | null };
type RawTimeout = RawModUser & { reason: string | null; expires_at: string };
type RawDelete = RawModUser & { message_id: string; message_body: string };
type RawAutomodTerms = {
  action: "add" | "remove";
  list: "blocked" | "permitted";
  terms: string[];
  from_automod: boolean;
};
type RawUnbanRequest = RawModUser & {
  is_approved: boolean;
  moderator_message: string;
};

export type RawModerate =
  & RawModerateBase
  & (
    | { action: "clear" }
    | { action: "ban"; ban: RawBan }
    | { action: "unban"; unban: RawModUser }
    | { action: "timeout"; timeout: RawTimeout }
    | { action: "untimeout"; untimeout: RawModUser }
    | { action: "delete"; delete: RawDelete }
    | { action: "shared_chat_ban"; shared_chat_ban: RawBan }
    | { action: "shared_chat_unban"; shared_chat_unban: RawModUser }
    | { action: "shared_chat_timeout"; shared_chat_timeout: RawTimeout }
    | { action: "shared_chat_untimeout"; shared_chat_untimeout: RawModUser }
    | { action: "shared_chat_delete"; shared_chat_delete: RawDelete }
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
    | {
      action:
        | "add_blocked_term"
        | "add_permitted_term"
        | "remove_blocked_term"
        | "remove_permitted_term";
      automod_terms: RawAutomodTerms;
    }
    | {
      action: "approve_unban_request" | "deny_unban_request";
      unban_request: RawUnbanRequest;
    }
  );

// channel.unban_request.create / resolve
export type RawUnbanRequestCreate = RawModUser & {
  broadcaster_user_id: string;
  id: string;
  text: string;
};

export type RawUnbanRequestResolve = RawModUser & {
  broadcaster_user_id: string;
  id: string;
  status: "approved" | "canceled" | "denied";
};

// channel.warning.acknowledge
export type RawWarningAcknowledge = RawModUser & {
  broadcaster_user_id: string;
};

// automod.message.hold
export type AutomodHeldReason =
  | {
    reason: "automod";
    automod: { category: string; level: number; boosts_immunity: boolean };
  }
  | {
    reason: "blocked_term";
    blocked_term: {
      terms_found: {
        term_id: string;
        boundary: { start_pos: number; end_pos: number };
      }[];
    };
  };

type RawAutomodFragment =
  | { type: "text"; text: string }
  | { type: "emote"; text: string; emote: { id: string; emote_set_id: string } }
  | { type: "cheermote"; text: string; cheermote: RawCheermote };

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

// automod.message.update
export type RawAutomodMessageUpdate = {
  broadcaster_user_id: string;
  message_id: string;
  status: string;
};

// channel.update
export type RawChannelUpdate = {
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  title: string;
  category_id: string;
  category_name: string;
};
