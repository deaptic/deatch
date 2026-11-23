import type { AnnouncementColor } from "../bindings.ts";
import type {
  BanEvasion,
  LowTrustStatus,
  MessageBadge,
  RawReply,
} from "./twitch/eventsub.ts";

export type Fragment =
  | { type: "text"; text: string }
  | { type: "emote"; text: string; id: string }
  | { type: "mention"; text: string; user_login: string }
  | { type: "cheermote"; text: string; prefix: string; bits: number }
  | { type: "gif"; text: string; url: string };

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
  moderator?: string;
  broadcaster_user_id: string;
};

export type SuspiciousInfo = {
  status: Exclude<LowTrustStatus, "none">;
  evasion: BanEvasion;
  bannedElsewhere: boolean;
};

export type Redemption = {
  reward: { id: string; title: string; prompt: string; cost: number };
  input?: string;
};

export type MessagePerk = "highlight" | "sub_only";

export type PowerUp = "message_effect" | "gigantified_emote";

export type FeedMessage = {
  kind: "message";
  message_id: string;
  chatter_user_id: string;
  chatter_login: string;
  chatter_name: string;
  color: string;
  fragments: Fragment[];
  badges: MessageBadge[];
  reply?: RawReply;
  timestamp: number;
  channel_points?:
    | { kind: MessagePerk }
    | { kind: "custom_reward"; redemption?: Redemption };
  first_message?: boolean;
  cheer?: { bits: number };
  power_up?: PowerUp;
  deleted?: boolean;
  automod_hold?: AutomodHoldInfo;
  suspicious?: SuspiciousInfo;
  source?: {
    id: string;
    login: string;
    name: string;
    messageId: string;
    badges: MessageBadge[];
  };
};

export type Person = {
  id?: string;
  login: string;
  name: string;
  color?: string;
};

export type NoticeText = { text: string; detail?: string; people?: Person[] };

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
  people?: Person[];
  message?: Fragment[];
  detail?: string;
  recipients?: Person[];
  announcement_color?: AnnouncementColor;
  clip?: { id: string };
  unban_request?: { id: string };
};

export type FeedEntry = FeedMessage | FeedEvent;

export type Reaction = { label: string; value: string; url: string };
