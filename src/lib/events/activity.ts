import { listenEventSub, unlistenAll } from "./listen.ts";
import type {
  EventKind,
  RawCharityCampaign,
  RawGoal,
  RawPoll,
  RawPrediction,
  RawShieldMode,
  RawUnbanRequestCreate,
  RawUnbanRequestResolve,
} from "../types/index.ts";
import {
  type Activity,
  activityFor,
  updateActivity,
} from "../stores/activity.ts";
import {
  charityFrom,
  goalFrom,
  pollFrom,
  predictionFrom,
  unbanRequestFrom,
  withGoal,
  withoutUnbanRequest,
  withUnbanRequest,
} from "../mappers/activity.ts";

type Raw = { broadcaster_user_id: string };

function listenActivity<T extends Raw>(
  kind: EventKind,
  change: (raw: T, current: Activity) => Partial<Activity>,
) {
  return listenEventSub<T>(kind, (e) => {
    const id = e.event.broadcaster_user_id;
    updateActivity(id, change(e.event, activityFor(id)));
  });
}

function listenCharity(
  kind: EventKind,
  change: (raw: RawCharityCampaign) => Partial<Activity>,
) {
  return listenEventSub<RawCharityCampaign>(kind, (e) =>
    updateActivity(e.event.broadcaster_id, change(e.event)),
  );
}

export function start(): () => void {
  const poll = (raw: RawPoll) => ({ poll: pollFrom(raw) });
  const goal = (raw: RawGoal, current: Activity) => ({
    goals: withGoal(current.goals, goalFrom(raw)),
  });
  const charity = (raw: RawCharityCampaign) => ({
    charity: charityFrom(raw),
  });
  const prediction = (raw: RawPrediction) => ({
    prediction: predictionFrom(raw),
  });
  return unlistenAll([
    listenActivity("channel.poll.begin", poll),
    listenActivity("channel.poll.progress", poll),
    listenActivity<RawPoll>("channel.poll.end", () => ({ poll: null })),
    listenActivity("channel.prediction.begin", prediction),
    listenActivity("channel.prediction.progress", prediction),
    listenActivity("channel.prediction.lock", prediction),
    listenActivity<RawPrediction>("channel.prediction.end", () => ({
      prediction: null,
    })),
    listenActivity<RawShieldMode>("channel.shield_mode.begin", () => ({
      shield: true,
    })),
    listenActivity<RawShieldMode>("channel.shield_mode.end", () => ({
      shield: false,
    })),
    listenActivity<RawUnbanRequestCreate>(
      "channel.unban_request.create",
      (raw, current) => ({
        unbanRequests: withUnbanRequest(
          current.unbanRequests,
          unbanRequestFrom(raw),
        ),
      }),
    ),
    listenActivity<RawUnbanRequestResolve>(
      "channel.unban_request.resolve",
      (raw, current) => ({
        unbanRequests: withoutUnbanRequest(current.unbanRequests, raw.id),
      }),
    ),
    listenActivity("channel.goal.begin", goal),
    listenActivity("channel.goal.progress", goal),
    listenActivity<RawGoal>("channel.goal.end", (raw, current) => ({
      goals: current.goals.filter((g) => g.id !== raw.id),
    })),
    listenCharity("channel.charity_campaign.start", charity),
    listenCharity("channel.charity_campaign.progress", charity),
    listenCharity("channel.charity_campaign.stop", () => ({ charity: null })),
  ]);
}
