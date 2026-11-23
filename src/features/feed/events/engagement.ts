import { unlistenAll } from "../../../platform/listen.ts";
import { listenFeed } from "./listenFeed.ts";
import type {
  EventKind,
  NoticeText,
  RawGoal,
  RawPoll,
  RawPrediction,
} from "../../../lib/types/index.ts";
import { feedEvent } from "../entries/feedEvent.ts";
import { GOAL, POLL, PREDICTION } from "../../../lib/constants/events.ts";
import { pollBegin, pollEnd } from "../entries/pollMessage.ts";
import {
  predictionBegin,
  predictionEnd,
  predictionLock,
} from "../entries/predictionMessage.ts";
import { goalBegin, goalEnd } from "../entries/goalMessage.ts";

type Stage<T> = [EventKind, (raw: T) => NoticeText | null];

function listenStages<T>(noticeType: string, stages: Stage<T>[]) {
  return stages.map(([kind, text]) =>
    listenFeed<T>(kind, (raw, timestamp) => {
      const notice = text(raw);
      return notice && feedEvent(noticeType, notice, timestamp);
    }),
  );
}

export function start(): () => void {
  return unlistenAll([
    ...listenStages<RawPoll>(POLL, [
      ["channel.poll.begin", pollBegin],
      ["channel.poll.end", pollEnd],
    ]),
    ...listenStages<RawPrediction>(PREDICTION, [
      ["channel.prediction.begin", predictionBegin],
      ["channel.prediction.lock", predictionLock],
      ["channel.prediction.end", predictionEnd],
    ]),
    ...listenStages<RawGoal>(GOAL, [
      ["channel.goal.begin", goalBegin],
      ["channel.goal.end", goalEnd],
    ]),
  ]);
}
