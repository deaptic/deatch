import type { FeedMessage } from "./feed.ts";

export type MentionReason =
  | { kind: "mention" }
  | { kind: "reply" }
  | { kind: "keyword"; term: string };

export type Mention = {
  id: string;
  channelId: string;
  channelLogin: string;
  channelName: string;
  message: FeedMessage;
  reason: MentionReason;
  timestamp: number;
  unread: boolean;
};
