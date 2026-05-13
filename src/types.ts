// Shapes returned by the Rust backend (Tauri commands and emitted events).
// UI-derived/composed types live next to the components that own them.

// ── Auth ───────────────────────────────────────────────────────────────────
export type DeviceCode = {
  user_code: string;
  verification_uri: string;
};

// ── Helix: users / streams / channels ──────────────────────────────────────
export type TwitchUser = {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string | null;
};

export type TwitchStream = {
  user_id: string;
  user_login: string;
  user_name: string;
  game_name: string;
  title: string;
  viewer_count: number;
  thumbnail_url: string;
};

export type Channel = {
  user_id: string;
  user_login: string;
  user_name: string;
  profile_image_url: string;
  game_name?: string;
  viewer_count?: number;
  title?: string;
  thumbnail_url?: string;
};

export type ModeratedChannel = {
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
};

// ── Helix: emotes ──────────────────────────────────────────────────────────
export type GlobalEmote = {
  id: string;
  name: string;
  images: { url_1x: string; url_2x: string; url_4x: string };
  format: string[];
  scale: string[];
  theme_mode: string[];
};

export type ChannelEmote = {
  name: string;
  images: { url_1x: string };
};

export type UserEmote = {
  id: string;
  name: string;
  emote_type: string;
  owner_id: string | null;
};

// ── Helix: chat badges ─────────────────────────────────────────────────────
export type ChatBadge = {
  id: string;
  image_url_1x: string;
  image_url_2x: string;
  image_url_4x: string;
  title: string;
  description: string;
};

export type BadgeSet = {
  set_id: string;
  versions: ChatBadge[];
};

// ── EventSub: chat message ─────────────────────────────────────────────────
export type RawFragment =
  | { type: "text"; text: string }
  | { type: "emote"; text: string; emote: { id: string } }
  | { type: "mention"; text: string; mention: { user_login: string } }
  | { type: "cheermote"; text: string; cheermote: unknown };

export type RawReply = {
  parent_message_id: string;
  parent_message_body: string;
  parent_user_name: string;
  parent_user_login: string;
};

export type Badge = {
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
  badges: Badge[];
  reply: RawReply | null;
  channel_points_custom_reward_id: string | null;
  /// Synthetic field set by the robotty backlog mapper when a CLEARMSG /
  /// CLEARCHAT in the same window targets this message. EventSub messages
  /// never carry this — they use a separate delete event.
  deleted?: boolean;
};

// ── EventSub: chat notification / shoutout / follow ────────────────────────
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

// ── EventSub: chat moderation (deletes / clears) ───────────────────────────
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

// ── EventSub: channel.moderate (mod-only, all moderator actions) ────────────
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

// ── External services proxied through Rust (BTTV / FFZ / 7TV) ──────────────
export type RustEmoteEntry = { name: string; url: string };

export type SevenTvChannelResult = {
  emotes: RustEmoteEntry[];
  emote_set_id: string | null;
};
