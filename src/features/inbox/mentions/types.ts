import type { FeedMessage } from "../../feed/index.ts";
import type { MentionKind } from "../../../shared/mentions.ts";

export type MentionReason =
  | { kind: Exclude<MentionKind, "keyword"> }
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
