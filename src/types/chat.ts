// Helix: chat badges.
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

// EventSub: chat message.
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

// EventSub: chat notification / shoutout / follow.
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
