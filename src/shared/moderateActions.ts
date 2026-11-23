import type { RawModerate } from "./types/index.ts";

const MODERATE_ACTIONS = [
  "clear",
  "ban",
  "unban",
  "timeout",
  "untimeout",
  "delete",
  "shared_chat_ban",
  "shared_chat_unban",
  "shared_chat_timeout",
  "shared_chat_untimeout",
  "shared_chat_delete",
  "mod",
  "unmod",
  "vip",
  "unvip",
  "raid",
  "unraid",
  "slow",
  "slowoff",
  "followers",
  "followersoff",
  "emoteonly",
  "emoteonlyoff",
  "subscribers",
  "subscribersoff",
  "uniquechat",
  "uniquechatoff",
  "warn",
  "add_blocked_term",
  "add_permitted_term",
  "remove_blocked_term",
  "remove_permitted_term",
  "approve_unban_request",
  "deny_unban_request",
] as const satisfies readonly RawModerate["action"][];

export const UNBAN_REQUEST = "unban_request";
export const WARNING_ACKNOWLEDGED = "warning_acknowledged";
export const SUSPICIOUS_USER = "suspicious_user";
export const HYPE_TRAIN = "hype_train";
export const POLL = "poll";
export const PREDICTION = "prediction";
export const GOAL = "goal";
export const AD_BREAK = "ad_break";
export const BITS_USE = "bits_use";
export const CHARITY_CAMPAIGN = "charity_campaign";
export const CHANNEL_POINTS_REDEMPTION = "channel_points_redemption";
export const CHANNEL_UPDATE = "channel_update";
export const SHARED_CHAT_SESSION = "shared_chat_session";
export const STREAM_ONLINE = "stream_online";
export const STREAM_OFFLINE = "stream_offline";
export const FOLLOW = "follow";
export const LOCAL = "local";
export const CHAT_CONNECTED = "chat_connected";
export const CHAT_DISCONNECTED = "chat_disconnected";
export const CHAT_CONNECT_FAILED = "chat_connect_failed";
export const CHAT_CLEARED = "chat_cleared";
export const SEVENTV_UPDATE = "seventv_update";

export function moderateNoticeType(action: RawModerate["action"]): string {
  return `moderate_${action}`;
}

export const EVENTS = [
  {
    key: "message",
    label: "SETTINGS_APPEARANCE_EVENT_MESSAGE_LABEL",
    description: "SETTINGS_APPEARANCE_EVENT_MESSAGE_DESCRIPTION",
    types: [],
    modOnly: false,
  },
  {
    key: "follow",
    label: "SETTINGS_APPEARANCE_EVENT_FOLLOW_LABEL",
    description: "SETTINGS_APPEARANCE_EVENT_FOLLOW_DESCRIPTION",
    types: [FOLLOW],
    modOnly: true,
  },
  {
    key: "sub",
    label: "SETTINGS_APPEARANCE_EVENT_SUB_LABEL",
    description: "SETTINGS_APPEARANCE_EVENT_SUB_DESCRIPTION",
    types: [
      "sub",
      "resub",
      "sub_gift",
      "community_sub_gift",
      "gift_paid_upgrade",
      "pay_it_forward",
      "prime_paid_upgrade",
      "shared_chat_sub",
      "shared_chat_resub",
      "shared_chat_sub_gift",
      "shared_chat_community_sub_gift",
      "shared_chat_gift_paid_upgrade",
      "shared_chat_pay_it_forward",
      "shared_chat_prime_paid_upgrade",
    ],
    modOnly: false,
  },
  {
    key: "raid",
    label: "SETTINGS_APPEARANCE_EVENT_RAID_LABEL",
    description: "SETTINGS_APPEARANCE_EVENT_RAID_DESCRIPTION",
    types: ["raid", "unraid", "shared_chat_raid"],
    modOnly: false,
  },
  {
    key: "announcement",
    label: "SETTINGS_APPEARANCE_EVENT_ANNOUNCEMENT_LABEL",
    description: "SETTINGS_APPEARANCE_EVENT_ANNOUNCEMENT_DESCRIPTION",
    types: ["announcement", "shared_chat_announcement"],
    modOnly: false,
  },
  {
    key: "charity_donation",
    label: "SETTINGS_APPEARANCE_EVENT_CHARITY_LABEL",
    description: "SETTINGS_APPEARANCE_EVENT_CHARITY_DESCRIPTION",
    types: [
      "charity_donation",
      "shared_chat_charity_donation",
      CHARITY_CAMPAIGN,
    ],
    modOnly: false,
  },
  {
    key: "channel_points",
    label: "SETTINGS_APPEARANCE_EVENT_CHANNEL_POINTS_LABEL",
    description: "SETTINGS_APPEARANCE_EVENT_CHANNEL_POINTS_DESCRIPTION",
    types: [CHANNEL_POINTS_REDEMPTION],
    modOnly: false,
  },
  {
    key: "channel",
    label: "SETTINGS_APPEARANCE_EVENT_CHANNEL_LABEL",
    description: "SETTINGS_APPEARANCE_EVENT_CHANNEL_DESCRIPTION",
    types: [CHANNEL_UPDATE, STREAM_ONLINE, STREAM_OFFLINE, SHARED_CHAT_SESSION],
    modOnly: false,
  },
  {
    key: "bits_badge_tier",
    label: "SETTINGS_APPEARANCE_EVENT_BITS_BADGE_LABEL",
    description: "SETTINGS_APPEARANCE_EVENT_BITS_BADGE_DESCRIPTION",
    types: ["bits_badge_tier", "shared_chat_bits_badge_tier"],
    modOnly: false,
  },
  {
    key: "hype_train",
    label: "SETTINGS_APPEARANCE_EVENT_HYPE_TRAIN_LABEL",
    description: "SETTINGS_APPEARANCE_EVENT_HYPE_TRAIN_DESCRIPTION",
    types: [HYPE_TRAIN],
    modOnly: false,
  },
  {
    key: "poll",
    label: "SETTINGS_APPEARANCE_EVENT_POLL_LABEL",
    description: "SETTINGS_APPEARANCE_EVENT_POLL_DESCRIPTION",
    types: [POLL],
    modOnly: false,
  },
  {
    key: "prediction",
    label: "SETTINGS_APPEARANCE_EVENT_PREDICTION_LABEL",
    description: "SETTINGS_APPEARANCE_EVENT_PREDICTION_DESCRIPTION",
    types: [PREDICTION],
    modOnly: false,
  },
  {
    key: "goal",
    label: "SETTINGS_APPEARANCE_EVENT_GOAL_LABEL",
    description: "SETTINGS_APPEARANCE_EVENT_GOAL_DESCRIPTION",
    types: [GOAL],
    modOnly: false,
  },
  {
    key: "ad_break",
    label: "SETTINGS_APPEARANCE_EVENT_AD_BREAK_LABEL",
    description: "SETTINGS_APPEARANCE_EVENT_AD_BREAK_DESCRIPTION",
    types: [AD_BREAK],
    modOnly: false,
  },
  {
    key: "bits_use",
    label: "SETTINGS_APPEARANCE_EVENT_POWER_UP_LABEL",
    description: "SETTINGS_APPEARANCE_EVENT_POWER_UP_DESCRIPTION",
    types: [BITS_USE],
    modOnly: false,
  },
  {
    key: "shoutout",
    label: "SETTINGS_APPEARANCE_EVENT_SHOUTOUT_LABEL",
    description: "SETTINGS_APPEARANCE_EVENT_SHOUTOUT_DESCRIPTION",
    types: ["shoutout"],
    modOnly: true,
  },
  {
    key: "moderation",
    label: "SETTINGS_APPEARANCE_EVENT_MODERATION_LABEL",
    description: "SETTINGS_APPEARANCE_EVENT_MODERATION_DESCRIPTION",
    types: [
      UNBAN_REQUEST,
      WARNING_ACKNOWLEDGED,
      SUSPICIOUS_USER,
      ...MODERATE_ACTIONS.map(moderateNoticeType),
    ],
    modOnly: true,
  },
] as const;

export type EventKey = (typeof EVENTS)[number]["key"];

export const NOTICE_TO_EVENT = Object.fromEntries(
  EVENTS.flatMap((e) => e.types.map((t) => [t, e.key])),
) as Record<string, EventKey>;
