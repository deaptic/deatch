import { listenEventSub, serverTime, unlistenAll } from "./listen.ts";
import type { RawPrediction } from "../types/twitch/eventsub.ts";
import { appendItem } from "../stores/feeds.ts";
import { feedEvent } from "../utils/feedEvent.ts";
import { PREDICTION } from "../constants/events.ts";
import {
  predictionBegin,
  predictionEnd,
  predictionLock,
} from "./prediction-message.ts";

const STAGES = {
  "channel.prediction.begin": predictionBegin,
  "channel.prediction.lock": predictionLock,
  "channel.prediction.end": predictionEnd,
} as const;

export function start(): () => void {
  return unlistenAll(
    Object.entries(STAGES).map(([kind, text]) =>
      listenEventSub<RawPrediction>(kind as keyof typeof STAGES, (e) => {
        const raw = e.payload.event;
        appendItem(
          raw.broadcaster_user_id,
          feedEvent(PREDICTION, text(raw), serverTime(e.payload)),
        );
      })
    ),
  );
}
