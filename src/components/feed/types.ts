import type { Badge } from "../../types";

export type Fragment =
  | { type: "text"; text: string }
  | { type: "emote"; text: string; id: string }
  | { type: "mention"; text: string; user_login: string }
  | { type: "cheermote"; text: string };

export type FeedReply = {
  parent_message_id: string;
  parent_message_body: string;
  parent_user_name: string;
  parent_user_login: string;
};

export type BadgeMap = Record<string, { url: string; title: string }>;

export type FeedMessage = {
  kind: "message";
  message_id: string;
  chatter_user_id: string;
  chatter_login: string;
  chatter_name: string;
  color: string;
  fragments: Fragment[];
  badges: Badge[];
  reply?: FeedReply;
  timestamp: number;
  channel_points?: boolean;
  first_message?: boolean;
  deleted?: boolean;
};

export type FeedEvent = {
  kind: "event";
  id: string;
  notice_type: string;
  system_message: string;
  chatter_user_id?: string;
  chatter_name: string;
  color: string;
  timestamp: number;
};

export type FeedItem = FeedMessage | FeedEvent;
