import type { Component } from "solid-js";
import ErrorIcon from "./icons/ErrorIcon";
import SuccessIcon from "./icons/SuccessIcon";
import InfoIcon from "./icons/InfoIcon";
import WarnIcon from "./icons/WarnIcon";
import LogIcon from "./icons/LogIcon";

export const COLORS = {
  error: {
    border: "border-l-red-500",
    accent: "border-red-500",
    bg: "bg-red-500/25",
    icon: "stroke-red-400",
    hex: "#ef4444",
  },
  info: {
    border: "border-l-blue-500",
    accent: "border-blue-500",
    bg: "bg-blue-500/25",
    icon: "stroke-blue-400",
    hex: "#3b82f6",
  },
  success: {
    border: "border-l-green-500",
    accent: "border-green-500",
    bg: "bg-green-500/25",
    icon: "stroke-green-400",
    hex: "#22c55e",
  },
  warn: {
    border: "border-l-yellow-500",
    accent: "border-yellow-500",
    bg: "bg-yellow-500/25",
    icon: "stroke-yellow-400",
    hex: "#eab308",
  },
  log: {
    border: "border-l-gray-500",
    accent: "border-gray-500",
    bg: "bg-gray-500/25",
    icon: "stroke-gray-400",
    hex: "#6b7280",
  },
} as const;

export type ColorKey = keyof typeof COLORS;

export const TOASTER_ICONS: Record<ColorKey, Component<{ class?: string }>> = {
  error: ErrorIcon,
  success: SuccessIcon,
  info: InfoIcon,
  warn: WarnIcon,
  log: LogIcon,
};

export const EVENTS = [
  {
    key: "message",
    label: "Messages",
    description: "Regular chat messages from viewers.",
    types: [],
    modOnly: false,
    testMessage: "Hello chat! This is a test message.",
  },
  {
    key: "follow",
    label: "Follows",
    description: "When a user follows the channel (mods only).",
    types: ["follow"],
    modOnly: true,
    testMessage: "TestUser is now following the channel!",
  },
  {
    key: "sub",
    label: "Subscriptions",
    description: "New subs, resubs, gifts, and Prime upgrades.",
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
    testMessage:
      "TestUser subscribed at Tier 1. They've subscribed for 3 months!",
  },
  {
    key: "raid",
    label: "Raids",
    description: "Incoming raids and unraids on the channel.",
    types: ["raid", "unraid", "shared_chat_raid"],
    modOnly: false,
    testMessage: "TestRaider is raiding the channel with a party of 42!",
  },
  {
    key: "announcement",
    label: "Announcements",
    description: "Highlighted announcements from the broadcaster or mods.",
    types: ["announcement", "shared_chat_announcement"],
    modOnly: false,
    testMessage: "This is a test announcement from the broadcaster.",
  },
  {
    key: "charity_donation",
    label: "Charity donations",
    description: "Donations made through the channel's charity campaign.",
    types: ["charity_donation"],
    modOnly: false,
    testMessage: "TestUser has donated $10.00 to charity.",
  },
  {
    key: "bits_badge_tier",
    label: "Bits badge tier",
    description: "When a viewer earns a new Bits badge tier.",
    types: ["bits_badge_tier"],
    modOnly: false,
    testMessage: "TestUser just earned a new 1000 Bits badge!",
  },
  {
    key: "shoutout",
    label: "Shoutouts",
    description: "Shoutouts created by the broadcaster or mods.",
    types: ["shoutout"],
    modOnly: true,
    testMessage: "Check out AnotherStreamer at twitch.tv/another!",
  },
] as const;

export type EventKey = (typeof EVENTS)[number]["key"];

export const NOTICE_TO_EVENT = Object.fromEntries(
  EVENTS.flatMap((e) => e.types.map((t) => [t, e.key])),
) as Record<string, EventKey>;

export const BADGE_CATEGORIES = [
  {
    key: "authority",
    label: "Authority",
    description: "Broadcaster, moderator, and VIP badges.",
    setIds: ["broadcaster", "moderator", "lead_moderator", "vip"],
  },
  {
    key: "predictions",
    label: "Predictions",
    description: "Channel prediction participation badges.",
    setIds: ["predictions"],
  },
  {
    key: "channel",
    label: "Channel",
    description: "Hype train, Bits, and sub-gifter badges.",
    setIds: ["hype-train", "bits", "bits-leader", "sub-gifter"],
  },
  {
    key: "subscriber",
    label: "Subscriber",
    description: "Subscriber tier and founder badges.",
    setIds: ["subscriber", "founder"],
  },
  {
    key: "vanity",
    label: "Vanity",
    description: "Twitch global, partner, and other miscellaneous badges.",
    setIds: [] as string[],
  },
] as const;

export type BadgeCategoryKey = (typeof BADGE_CATEGORIES)[number]["key"];

export function badgeCategoryFor(setId: string): BadgeCategoryKey {
  for (const c of BADGE_CATEGORIES)
    if ((c.setIds as readonly string[]).includes(setId)) return c.key;
  return "vanity";
}
