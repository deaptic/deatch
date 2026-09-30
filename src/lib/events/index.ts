import { events } from "../bindings.ts";

import "./auth.ts";
import "./chat.ts";
import "./notifications.ts";
import "./moderation.ts";
import "./eventsub.ts";
import "./watch.ts";

export { mapChatMessage } from "./chat-mapper.ts";

events.eventSubFailed.listen((e) => {
  console.error("EventSub error:", e.payload);
});
