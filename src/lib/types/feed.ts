import type { MessageBadge } from "./twitch/eventsub.ts";

export type Fragment =
  | { type: "text"; text: string }
  | { type: "emote"; text: string; id: string }
  | { type: "mention"; text: string; user_login: string }
  | { type: "cheermote"; text: string; prefix: string; bits: number };

type FeedReply = {
  parent_message_id: string;
  parent_message_body: string;
  parent_user_name: string;
  parent_user_login: string;
  parent_user_id: string;
};

export type BadgeMap = Record<string, { url: string; title: string }>;

export type AutomodHoldStatus =
  | "pending"
  | "approving"
  | "denying"
  | "approved"
  | "denied"
  | "expired";

export type AutomodHoldInfo = {
  reason: string;
  status: AutomodHoldStatus;
  broadcaster_user_id: string;
};

export type Redemption = {
  reward: { id: string; title: string; prompt: string };
  input?: string;
};

export type FeedMessage = {
  kind: "message";
  message_id: string;
  chatter_user_id: string;
  chatter_login: string;
  chatter_name: string;
  color: string;
  fragments: Fragment[];
  badges: MessageBadge[];
  reply?: FeedReply;
  timestamp: number;
  channel_points?:
    | { kind: "highlight" }
    | { kind: "custom_reward"; redemption?: Redemption };
  first_message?: boolean;
  cheer?: { bits: number };
  deleted?: boolean;
  automod_hold?: AutomodHoldInfo;
};

export type FeedEvent = {
  kind: "event";
  id: string;
  notice_type: string;
  system_message: string;
  chatter_user_id?: string;
  chatter_login?: string;
  chatter_name: string;
  color: string;
  timestamp: number;
  silent?: boolean;
  clip?: { id: string };
  redemption?: Redemption;
};

export type FeedEntry = FeedMessage | FeedEvent;
