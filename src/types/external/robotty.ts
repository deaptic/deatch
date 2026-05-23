// Mirrors Rust dto::external::robotty — snake_case wire format (matches the
// EventSub `channel.chat.message` shape so renderers can consume both).

export type EmoteRef = {
  id: string;
};

export type MentionRef = {
  user_login: string;
};

export type Fragment =
  | { type: "text"; text: string }
  | { type: "emote"; text: string; emote: EmoteRef }
  | { type: "mention"; text: string; mention: MentionRef };

export type MessageBody = {
  text: string;
  fragments: Fragment[];
};

export type Badge = {
  set_id: string;
  id: string;
  info: string;
};

export type Reply = {
  parent_message_id: string;
  parent_message_body: string;
  parent_user_name: string;
  parent_user_login: string;
};

export type RecentMessage = {
  broadcaster_user_id: string;
  message_id: string;
  chatter_user_id: string;
  chatter_user_login: string;
  chatter_user_name: string;
  color: string;
  message: MessageBody;
  message_type: string;
  badges: Badge[];
  reply: Reply | null;
  channel_points_custom_reward_id: string | null;
  timestamp_ms: number;
  deleted: boolean;
};
