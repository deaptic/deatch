import * as auth from "./auth.ts";
import * as channel from "./channel.ts";
import * as chat from "./chat.ts";
import * as eventsub from "./eventsub.ts";
import * as moderation from "./moderation.ts";
import * as notifications from "./notifications.ts";
import * as watch from "./watch.ts";

export function start(): () => void {
  const stops = [
    auth.start(),
    channel.start(),
    chat.start(),
    eventsub.start(),
    moderation.start(),
    notifications.start(),
    watch.start(),
  ];
  return () => {
    for (const stop of stops) stop();
  };
}
