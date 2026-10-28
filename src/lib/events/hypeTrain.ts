import { listenFeed, unlistenAll } from "./listen.ts";
import type { RawHypeTrain } from "../types/twitch/eventsub.ts";
import { feedEvent } from "../utils/feedEvent.ts";
import { HYPE_TRAIN } from "../constants/events.ts";
import {
  hypeTrainBegin,
  hypeTrainEnd,
  hypeTrainProgress,
} from "../mappers/hype-train-message.ts";

export function start(): () => void {
  // Progress arrives on every contribution; only a new level earns a row.
  const levels = new Map<string, number>();

  const stop = unlistenAll([
    listenFeed<RawHypeTrain>("channel.hype_train.begin", (raw, timestamp) => {
      levels.set(raw.id, raw.level);
      return feedEvent(HYPE_TRAIN, hypeTrainBegin(raw), timestamp);
    }),
    listenFeed<RawHypeTrain>(
      "channel.hype_train.progress",
      (raw, timestamp) => {
        const text = hypeTrainProgress(raw, levels.get(raw.id) ?? raw.level);
        levels.set(raw.id, raw.level);
        return text ? feedEvent(HYPE_TRAIN, text, timestamp) : null;
      },
    ),
    listenFeed<RawHypeTrain>("channel.hype_train.end", (raw, timestamp) => {
      levels.delete(raw.id);
      return feedEvent(HYPE_TRAIN, hypeTrainEnd(raw), timestamp);
    }),
  ]);
  return () => {
    stop();
    levels.clear();
  };
}
