// Polls, predictions and goals: each stage of one becomes a feed row.

import { listenEventSub, serverTime, unlistenAll } from "./listen.ts";
import type {
  EventKind,
  RawGoal,
  RawPoll,
  RawPrediction,
} from "../types/twitch/eventsub.ts";
import { appendItem } from "../stores/feeds.ts";
import { feedEvent } from "../utils/feedEvent.ts";
import type { NoticeText } from "../types/feed.ts";
import { GOAL, POLL, PREDICTION } from "../constants/events.ts";
import { pollBegin, pollEnd } from "./poll-message.ts";
import {
  predictionBegin,
  predictionEnd,
  predictionLock,
} from "./prediction-message.ts";
import { goalBegin, goalEnd } from "./goal-message.ts";

/// A stage's text, or null when the stage earns no row.
type Stage<T> = [EventKind, (raw: T) => NoticeText | null];

function listenStages<T extends { broadcaster_user_id: string }>(
  noticeType: string,
  stages: Stage<T>[],
) {
  return stages.map(([kind, text]) =>
    listenEventSub<T>(kind, (e) => {
      const raw = e.payload.event;
      const message = text(raw);
      if (!message) return;
      appendItem(
        raw.broadcaster_user_id,
        feedEvent(noticeType, message, serverTime(e.payload)),
      );
    })
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
