export const BADGE_CATEGORIES = [
  {
    key: "authority",
    label: "BADGE_AUTHORITY",
    description: "BADGE_AUTHORITY_DESCRIPTION",
    setIds: ["broadcaster", "moderator", "lead_moderator", "vip"],
  },
  {
    key: "predictions",
    label: "BADGE_PREDICTIONS",
    description: "BADGE_PREDICTIONS_DESCRIPTION",
    setIds: ["predictions"],
  },
  {
    key: "channel",
    label: "BADGE_CHANNEL",
    description: "BADGE_CHANNEL_DESCRIPTION",
    setIds: ["hype-train", "bits", "bits-leader", "sub-gifter"],
  },
  {
    key: "subscriber",
    label: "BADGE_SUBSCRIBER",
    description: "BADGE_SUBSCRIBER_DESCRIPTION",
    setIds: ["subscriber", "founder"],
  },
  {
    key: "vanity",
    label: "BADGE_VANITY",
    description: "BADGE_VANITY_DESCRIPTION",
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
