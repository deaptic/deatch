import * as activity from "../../features/activity/index.ts";
import * as auth from "./auth.ts";
import * as channel from "./channel.ts";
import * as chat from "./chat.ts";
import * as chatSettings from "../../features/chat-modes/index.ts";
import * as engagement from "./engagement.ts";
import * as eventsub from "./eventsub.ts";
import * as hypeTrain from "./hypeTrain.ts";
import * as moderation from "./moderation.ts";
import * as notifications from "./notifications.ts";
import * as link from "../../features/link/index.ts";

export function start(): () => void {
  const stops = [
    activity.start(),
    auth.start(),
    channel.start(),
    chat.start(),
    chatSettings.start(),
    engagement.start(),
    eventsub.start(),
    hypeTrain.start(),
    moderation.start(),
    notifications.start(),
    link.start(),
  ];
  return () => {
    for (const stop of stops) stop();
  };
}
