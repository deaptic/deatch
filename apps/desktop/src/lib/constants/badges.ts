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
  for (const c of BADGE_CATEGORIES) {
    if ((c.setIds as readonly string[]).includes(setId)) return c.key;
  }
  return "vanity";
}
