import { unlistenAll } from "../../../platform/listen.ts";
import { listenFeed } from "./listenFeed.ts";
import type { RawHypeTrain } from "../../../platform/twitch/eventsubPayloads.ts";
import { feedEvent } from "../entries/feedEvent.ts";
import { HYPE_TRAIN } from "../../../shared/moderateActions.ts";
import {
  hypeTrainBegin,
  hypeTrainEnd,
  hypeTrainProgress,
} from "../entries/hypeTrainMessage.ts";

export function start(): () => void {
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
