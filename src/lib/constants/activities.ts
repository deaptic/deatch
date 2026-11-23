import type { MessageKey } from "../i18n/index.ts";

export const ACTIVITIES = [
  "shield",
  "unbans",
  "ads",
  "goals",
  "charity",
  "poll",
  "prediction",
  "raid",
] as const;

export type ActivityKind = (typeof ACTIVITIES)[number];

export const ACTIVITY_LABELS: Record<ActivityKind, MessageKey> = {
  shield: "HEADER_ACTIVITY_SHIELD_LABEL",
  goals: "HEADER_ACTIVITY_GOALS_LABEL",
  charity: "HEADER_ACTIVITY_CHARITY_LABEL",
  raid: "HEADER_ACTIVITY_RAID_LABEL",
  unbans: "HEADER_ACTIVITY_UNBANS_LABEL",
  ads: "HEADER_ACTIVITY_ADS_LABEL",
  poll: "HEADER_ACTIVITY_POLL_LABEL",
  prediction: "HEADER_ACTIVITY_PREDICTION_LABEL",
};
