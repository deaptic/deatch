import { listenEventSub, serverTime, unlistenAll } from "./listen.ts";
import type { RawPoll } from "../types/twitch/eventsub.ts";
import { appendItem } from "../stores/feeds.ts";
import { feedEvent } from "../utils/feedEvent.ts";
import { POLL } from "../constants/events.ts";
import { pollBegin, pollEnd } from "./poll-message.ts";

export function start(): () => void {
  return unlistenAll([
    listenEventSub<RawPoll>("channel.poll.begin", (e) => {
      const raw = e.payload.event;
      appendItem(
        raw.broadcaster_user_id,
        feedEvent(POLL, pollBegin(raw), serverTime(e.payload)),
      );
    }),
    listenEventSub<RawPoll>("channel.poll.end", (e) => {
      const raw = e.payload.event;
      const text = pollEnd(raw);
      if (!text) return;
      appendItem(
        raw.broadcaster_user_id,
        feedEvent(POLL, text, serverTime(e.payload)),
      );
    }),
  ]);
}
