import type { MessageKey } from "./i18n/index.ts";

export const ACTIVITIES = [
  "shield",
  "unbans",
  "pinned",
  "ads",
  "hypeTrain",
  "goals",
  "charity",
  "drops",
  "poll",
  "prediction",
  "raid",
] as const;

export type ActivityKind = (typeof ACTIVITIES)[number];

const VIEWER_ACTIVITIES: ReadonlySet<ActivityKind> = new Set(["drops"]);

export const activitiesFor = (moderating: boolean): readonly ActivityKind[] =>
  moderating
    ? ACTIVITIES
    : ACTIVITIES.filter((kind) => VIEWER_ACTIVITIES.has(kind));

export const ACTIVITY_LABELS: Record<ActivityKind, MessageKey> = {
  pinned: "HEADER_ACTIVITY_PINNED_LABEL",
  shield: "HEADER_ACTIVITY_SHIELD_LABEL",
  hypeTrain: "HEADER_ACTIVITY_HYPE_TRAIN_LABEL",
  goals: "HEADER_ACTIVITY_GOALS_LABEL",
  charity: "HEADER_ACTIVITY_CHARITY_LABEL",
  drops: "HEADER_ACTIVITY_DROPS_LABEL",
  raid: "HEADER_ACTIVITY_RAID_LABEL",
  unbans: "HEADER_ACTIVITY_UNBANS_LABEL",
  ads: "HEADER_ACTIVITY_ADS_LABEL",
  poll: "HEADER_ACTIVITY_POLL_LABEL",
  prediction: "HEADER_ACTIVITY_PREDICTION_LABEL",
};
