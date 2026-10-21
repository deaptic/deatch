import { listenEventSub, serverTime, unlistenAll } from "./listen.ts";
import type { RawGoal } from "../types/twitch/eventsub.ts";
import { appendItem } from "../stores/feeds.ts";
import { feedEvent } from "../utils/feedEvent.ts";
import { GOAL } from "../constants/events.ts";
import { goalBegin, goalEnd } from "./goal-message.ts";

const STAGES = {
  "channel.goal.begin": goalBegin,
  "channel.goal.end": goalEnd,
} as const;

export function start(): () => void {
  return unlistenAll(
    Object.entries(STAGES).map(([kind, text]) =>
      listenEventSub<RawGoal>(kind as keyof typeof STAGES, (e) => {
        const raw = e.payload.event;
        appendItem(
          raw.broadcaster_user_id,
          feedEvent(GOAL, text(raw), serverTime(e.payload)),
        );
      })
    ),
  );
}
