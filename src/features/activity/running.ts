import { ACTIVITIES, type ActivityKind } from "../../shared/activities.ts";
import type { Activity } from "./store.ts";

export function runningActivities(
  activity: Activity,
  raiding: boolean,
): ActivityKind[] {
  const running: Record<ActivityKind, boolean> = {
    shield: activity.shield,
    unbans: activity.unbanRequests.length > 0,
    pinned: activity.pinned !== null,
    ads: activity.ads?.nextAdMs != null,
    hypeTrain: activity.hypeTrain !== null,
    goals: activity.goals.length > 0,
    charity: activity.charity !== null,
    poll: activity.poll !== null,
    prediction: activity.prediction !== null,
    raid: raiding,
  };
  return ACTIVITIES.filter((kind) => running[kind]);
}
