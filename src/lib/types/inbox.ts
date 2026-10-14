import type { FeedMessage } from "./feed.ts";
import type { MentionReason } from "../utils/mention.ts";

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
