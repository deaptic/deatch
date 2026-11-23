export const BADGE_CATEGORIES = [
  {
    key: "authority",
    label: "SETTINGS_APPEARANCE_BADGE_AUTHORITY_LABEL",
    description: "SETTINGS_APPEARANCE_BADGE_AUTHORITY_DESCRIPTION",
    setIds: ["broadcaster", "moderator", "lead_moderator", "vip"],
  },
  {
    key: "predictions",
    label: "SETTINGS_APPEARANCE_BADGE_PREDICTIONS_LABEL",
    description: "SETTINGS_APPEARANCE_BADGE_PREDICTIONS_DESCRIPTION",
    setIds: ["predictions"],
  },
  {
    key: "channel",
    label: "SETTINGS_APPEARANCE_BADGE_CHANNEL_LABEL",
    description: "SETTINGS_APPEARANCE_BADGE_CHANNEL_DESCRIPTION",
    setIds: ["hype-train", "bits", "bits-leader", "sub-gifter"],
  },
  {
    key: "subscriber",
    label: "SETTINGS_APPEARANCE_BADGE_SUBSCRIBER_LABEL",
    description: "SETTINGS_APPEARANCE_BADGE_SUBSCRIBER_DESCRIPTION",
    setIds: ["subscriber", "founder"],
  },
  {
    key: "vanity",
    label: "SETTINGS_APPEARANCE_BADGE_VANITY_LABEL",
    description: "SETTINGS_APPEARANCE_BADGE_VANITY_DESCRIPTION",
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
