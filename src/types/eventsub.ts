export type EventKind =
  | "channel.chat.message"
  | "channel.chat.notification"
  | "channel.chat.message_delete"
  | "channel.chat.clear"
  | "channel.chat.clear_user_messages"
  | "channel.shoutout.create"
  | "channel.follow"
  | "channel.moderate"
  | "automod.message.hold";

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
export const ALL_KINDS: EventKind[] = [...CHAT_KINDS, ...MOD_KINDS];

export type SubStatus = "pending" | "active" | "failed" | "disconnected";
