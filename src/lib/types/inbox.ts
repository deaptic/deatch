import type { FeedMessage } from "./feed.ts";

export type MentionReason =
  | { kind: "mention" }
  | { kind: "reply" }
  | { kind: "keyword"; term: string };

export type Mention = {
  id: string;
  broadcasterId: string;
  broadcasterLogin: string;
  broadcasterName: string;
  message: FeedMessage;
  reason: MentionReason;
  timestamp: number;
  unread: boolean;
};
