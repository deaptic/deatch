import type { AnnouncementColor } from "../bindings.ts";
import type { MessageBadge } from "./twitch/eventsub.ts";

export type Fragment =
  | { type: "text"; text: string }
  | { type: "emote"; text: string; id: string }
  | { type: "mention"; text: string; user_login: string }
  | { type: "cheermote"; text: string; prefix: string; bits: number }
  /// Twitch requires the URL be shown exactly as given.
  | { type: "gif"; text: string; url: string };

type FeedReply = {
  parent_message_id: string;
  parent_message_body: string;
  parent_user_name: string;
  parent_user_login: string;
  parent_user_id: string;
  thread_message_id?: string | null;
  thread_user_login?: string | null;
  thread_user_name?: string | null;
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
  /// Who approved or denied it, once Twitch says.
  moderator?: string;
  broadcaster_user_id: string;
};

/// Why Twitch flags the chatter, shown to mods on their messages.
export type SuspiciousInfo = {
  status: "active_monitoring" | "restricted";
  evasion: "unknown" | "possible" | "likely";
  bannedElsewhere: boolean;
};

export type Redemption = {
  reward: { id: string; title: string; prompt: string; cost: number };
  input?: string;
};

/// A look bought with channel points for the whole message.
export type MessagePerk = "highlight" | "sub_only";

/// A look bought with bits for the whole message.
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
  reply?: FeedReply;
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
  /// The channel a shared chat message was sent in.
  source?: {
    id: string;
    login: string;
    name: string;
    messageId: string;
    /// The chatter's badges in that channel; `badges` holds them here.
    badges: MessageBadge[];
  };
};

/// Someone a notice names; shown as a name link.
export type Person = {
  id?: string;
  login: string;
  name: string;
  color?: string;
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
  /// Everyone besides the chatter whose name the text links.
  people?: Person[];
  /// The chatter's own words, shown like their chat message.
  message?: Fragment[];
  /// Everything else worth knowing, on a quieter line of its own.
  detail?: string;
  /// Who received a community gift's subs, as they arrive.
  recipients?: Person[];
  announcement_color?: AnnouncementColor;
  clip?: { id: string };
};

export type FeedEntry = FeedMessage | FeedEvent;
