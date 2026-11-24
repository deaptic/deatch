import { listenEventSub, unlistenAll } from "../../platform/listen.ts";
import * as activity from "./store.ts";
import { createTimeouts } from "../../shared/timeouts.ts";
import type { EventKind } from "../../shared/types/index.ts";
import type {
  RawAdBreak,
  RawCharityCampaign,
  RawGoal,
  RawHypeTrain,
  RawPoll,
  RawPrediction,
  RawShieldMode,
  RawStreamOnline,
  RawUnbanRequestCreate,
  RawUnbanRequestResolve,
} from "../../platform/twitch/eventsubPayloads.ts";
import { type Activity, clear, forChannel, update } from "./store.ts";
import * as channels from "../channels/index.ts";
import { selectedChannel } from "../navigation/index.ts";
import {
  charityFrom,
  goalFrom,
  hypeTrainFrom,
  pollFrom,
  predictionFrom,
  unbanRequestFrom,
  withGoal,
  withoutUnbanRequest,
  withUnbanRequest,
} from "./model.ts";

type Raw = { broadcaster_user_id: string };

function listenActivity<T extends Raw>(
  kind: EventKind,
  change: (raw: T, current: Activity) => Partial<Activity>,
) {
  return listenEventSub<T>(kind, (e) => {
    const id = e.event.broadcaster_user_id;
    update(id, change(e.event, forChannel(id)));
  });
}

function listenCharity(
  kind: EventKind,
  change: (raw: RawCharityCampaign) => Partial<Activity>,
) {
  return listenEventSub<RawCharityCampaign>(kind, (e) =>
    update(e.event.broadcaster_id, change(e.event)),
  );
}

const AD_REFRESH_MARGIN_MS = 5_000;
const PIN_POLL_MS = 60_000;

export function start(): () => void {
  const timeouts = createTimeouts();
  const poll = (raw: RawPoll) => ({ poll: pollFrom(raw) });
  const goal = (raw: RawGoal, current: Activity) => ({
    goals: withGoal(current.goals, goalFrom(raw)),
  });
  const charity = (raw: RawCharityCampaign) => ({
    charity: charityFrom(raw),
  });
  const hypeTrain = (raw: RawHypeTrain) => ({
    hypeTrain: hypeTrainFrom(raw),
  });
  const prediction = (raw: RawPrediction) => ({
    prediction: predictionFrom(raw),
  });
  const stops = unlistenAll([
    listenActivity<RawAdBreak>("channel.ad_break.begin", (raw) => {
      timeouts.after(raw.duration_seconds * 1000 + AD_REFRESH_MARGIN_MS, () =>
        activity.refreshAds(raw.broadcaster_user_id),
      );
      return { ads: null };
    }),
    listenEventSub<RawStreamOnline>("stream.online", (e) =>
      activity.refreshAds(e.event.broadcaster_user_id),
    ),
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
    listenActivity("channel.hype_train.begin", hypeTrain),
    listenActivity("channel.hype_train.progress", hypeTrain),
    listenActivity<RawHypeTrain>("channel.hype_train.end", () => ({
      hypeTrain: null,
    })),
    listenActivity("channel.goal.begin", goal),
    listenActivity("channel.goal.progress", goal),
    listenActivity<RawGoal>("channel.goal.end", (raw, current) => ({
      goals: current.goals.filter((g) => g.id !== raw.id),
    })),
    listenCharity("channel.charity_campaign.start", charity),
    listenCharity("channel.charity_campaign.progress", charity),
    listenCharity("channel.charity_campaign.stop", () => ({ charity: null })),
  ]);
  const leave = channels.onChannel({ leave: clear });
  const pinPoll = setInterval(() => {
    const id = selectedChannel()?.id;
    if (id) activity.refreshPinned(id);
  }, PIN_POLL_MS);
  return () => {
    stops();
    leave();
    timeouts.clear();
    clearInterval(pinPoll);
  };
}
