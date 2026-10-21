import type { RawModerate } from "../types/twitch/eventsub.ts";

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
export const HYPE_TRAIN = "hype_train";
export const POLL = "poll";
export const PREDICTION = "prediction";
export const GOAL = "goal";
export const AD_BREAK = "ad_break";
export const BITS_USE = "bits_use";
export const CHARITY_CAMPAIGN = "charity_campaign";

export function moderateNoticeType(action: RawModerate["action"]): string {
  return `moderate_${action}`;
}

export const EVENTS = [
  {
    key: "message",
    label: "EVENT_TYPE_MESSAGE",
    description: "EVENT_TYPE_MESSAGE_DESCRIPTION",
    types: [],
    modOnly: false,
  },
  {
    key: "follow",
    label: "EVENT_TYPE_FOLLOW",
    description: "EVENT_TYPE_FOLLOW_DESCRIPTION",
    types: ["follow"],
    modOnly: true,
  },
  {
    key: "sub",
    label: "EVENT_TYPE_SUB",
    description: "EVENT_TYPE_SUB_DESCRIPTION",
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
    label: "EVENT_TYPE_RAID",
    description: "EVENT_TYPE_RAID_DESCRIPTION",
    types: ["raid", "unraid", "shared_chat_raid"],
    modOnly: false,
  },
  {
    key: "announcement",
    label: "EVENT_TYPE_ANNOUNCEMENT",
    description: "EVENT_TYPE_ANNOUNCEMENT_DESCRIPTION",
    types: ["announcement", "shared_chat_announcement"],
    modOnly: false,
  },
  {
    key: "charity_donation",
    label: "EVENT_TYPE_CHARITY_DONATION",
    description: "EVENT_TYPE_CHARITY_DONATION_DESCRIPTION",
    types: [
      "charity_donation",
      "shared_chat_charity_donation",
      CHARITY_CAMPAIGN,
    ],
    modOnly: false,
  },
  {
    key: "bits_badge_tier",
    label: "EVENT_TYPE_BITS_BADGE_TIER",
    description: "EVENT_TYPE_BITS_BADGE_TIER_DESCRIPTION",
    types: ["bits_badge_tier"],
    modOnly: false,
  },
  {
    key: "hype_train",
    label: "EVENT_TYPE_HYPE_TRAIN",
    description: "EVENT_TYPE_HYPE_TRAIN_DESCRIPTION",
    types: [HYPE_TRAIN],
    modOnly: false,
  },
  {
    key: "poll",
    label: "EVENT_TYPE_POLL",
    description: "EVENT_TYPE_POLL_DESCRIPTION",
    types: [POLL],
    modOnly: false,
  },
  {
    key: "prediction",
    label: "EVENT_TYPE_PREDICTION",
    description: "EVENT_TYPE_PREDICTION_DESCRIPTION",
    types: [PREDICTION],
    modOnly: false,
  },
  {
    key: "goal",
    label: "EVENT_TYPE_GOAL",
    description: "EVENT_TYPE_GOAL_DESCRIPTION",
    types: [GOAL],
    modOnly: false,
  },
  {
    key: "ad_break",
    label: "EVENT_TYPE_AD_BREAK",
    description: "EVENT_TYPE_AD_BREAK_DESCRIPTION",
    types: [AD_BREAK],
    modOnly: false,
  },
  {
    key: "bits_use",
    label: "EVENT_TYPE_BITS_USE",
    description: "EVENT_TYPE_BITS_USE_DESCRIPTION",
    types: [BITS_USE],
    modOnly: false,
  },
  {
    key: "shoutout",
    label: "EVENT_TYPE_SHOUTOUT",
    description: "EVENT_TYPE_SHOUTOUT_DESCRIPTION",
    types: ["shoutout"],
    modOnly: true,
  },
  {
    key: "moderation",
    label: "EVENT_TYPE_MODERATION",
    description: "EVENT_TYPE_MODERATION_DESCRIPTION",
    types: [
      UNBAN_REQUEST,
      WARNING_ACKNOWLEDGED,
      ...MODERATE_ACTIONS.map(moderateNoticeType),
    ],
    modOnly: true,
  },
] as const;

export type EventKey = (typeof EVENTS)[number]["key"];

export const NOTICE_TO_EVENT = Object.fromEntries(
  EVENTS.flatMap((e) => e.types.map((t) => [t, e.key])),
) as Record<string, EventKey>;
