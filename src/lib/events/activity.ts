// The running poll, prediction and shield mode, kept current from each stage.

import { listenEventSub, unlistenAll } from "./listen.ts";
import type {
  EventKind,
  RawPoll,
  RawPrediction,
  RawShieldMode,
} from "../types/index.ts";
import { type Activity, updateActivity } from "../stores/activity.ts";
import { pollFrom, predictionFrom } from "../mappers/activity.ts";

type Raw = { broadcaster_user_id: string };

function listenActivity<T extends Raw>(
  kind: EventKind,
  change: (raw: T) => Partial<Activity>,
) {
  return listenEventSub<T>(kind, (e) =>
    updateActivity(e.event.broadcaster_user_id, change(e.event)),
  );
}

export function start(): () => void {
  const poll = (raw: RawPoll) => ({ poll: pollFrom(raw) });
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
  ]);
}
