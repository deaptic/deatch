import { listenEventSub, serverTime, unlistenAll } from "./listen.ts";
import type { NoticeText } from "../types/feed.ts";
import type { RawHypeTrain } from "../types/twitch/eventsub.ts";
import { appendItem } from "../stores/feeds.ts";
import { feedEvent } from "../utils/feedEvent.ts";
import { HYPE_TRAIN } from "../constants/events.ts";
import {
  hypeTrainBegin,
  hypeTrainEnd,
  hypeTrainProgress,
} from "./hype-train-message.ts";

export function start(): () => void {
  // Progress arrives on every contribution; only a new level earns a row.
  const levels = new Map<string, number>();

  function append(
    raw: RawHypeTrain,
    text: string | NoticeText,
    timestamp: number,
  ) {
    appendItem(
      raw.broadcaster_user_id,
      feedEvent(HYPE_TRAIN, text, timestamp),
    );
  }

  const stop = unlistenAll([
    listenEventSub<RawHypeTrain>("channel.hype_train.begin", (e) => {
      const raw = e.payload.event;
      levels.set(raw.id, raw.level);
      append(raw, hypeTrainBegin(raw), serverTime(e.payload));
    }),
    listenEventSub<RawHypeTrain>("channel.hype_train.progress", (e) => {
      const raw = e.payload.event;
      const text = hypeTrainProgress(raw, levels.get(raw.id) ?? raw.level);
      levels.set(raw.id, raw.level);
      if (text) append(raw, text, serverTime(e.payload));
    }),
    listenEventSub<RawHypeTrain>("channel.hype_train.end", (e) => {
      const raw = e.payload.event;
      levels.delete(raw.id);
      append(raw, hypeTrainEnd(raw), serverTime(e.payload));
    }),
  ]);
  return () => {
    stop();
    levels.clear();
  };
}
