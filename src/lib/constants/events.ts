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
] as const satisfies readonly RawModerate["action"][];

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
    types: ["charity_donation"],
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
    types: MODERATE_ACTIONS.map(moderateNoticeType),
    modOnly: true,
  },
] as const;

export type EventKey = (typeof EVENTS)[number]["key"];

export const NOTICE_TO_EVENT = Object.fromEntries(
  EVENTS.flatMap((e) => e.types.map((t) => [t, e.key])),
) as Record<string, EventKey>;
