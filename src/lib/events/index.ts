import * as auth from "./auth.ts";
import * as channel from "./channel.ts";
import * as chat from "./chat.ts";
import * as chatSettings from "./chatSettings.ts";
import * as emoteSets from "./emoteSets.ts";
import * as eventsub from "./eventsub.ts";
import * as goals from "./goals.ts";
import * as hypeTrain from "./hypeTrain.ts";
import * as moderation from "./moderation.ts";
import * as notifications from "./notifications.ts";
import * as polls from "./polls.ts";
import * as predictions from "./predictions.ts";
import * as link from "./link.ts";

export function start(): () => void {
  const stops = [
    auth.start(),
    channel.start(),
    chat.start(),
    chatSettings.start(),
    emoteSets.start(),
    eventsub.start(),
    goals.start(),
    hypeTrain.start(),
    moderation.start(),
    notifications.start(),
    polls.start(),
    predictions.start(),
    link.start(),
  ];
  return () => {
    for (const stop of stops) stop();
  };
}
