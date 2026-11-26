import { ACTIVITIES, type ActivityKind } from "../../shared/activities.ts";
import type { Activity } from "./store.ts";

type Viewer = { raiding: boolean; dropping: boolean };

export function runningActivities(
  activity: Activity,
  viewer: Viewer,
): ActivityKind[] {
  const running: Record<ActivityKind, boolean> = {
    shield: activity.shield,
    unbans: activity.unbanRequests.length > 0,
    pinned: activity.pinned !== null,
    ads: activity.ads?.nextAdMs != null,
    hypeTrain: activity.hypeTrain !== null,
    goals: activity.goals.length > 0,
    charity: activity.charity !== null,
    drops: viewer.dropping,
    poll: activity.poll !== null,
    prediction: activity.prediction !== null,
    raid: viewer.raiding,
  };
  return ACTIVITIES.filter((kind) => running[kind]);
}
