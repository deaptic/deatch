import { listen } from "@tauri-apps/api/event";

import "./auth.ts";
import "./chat.ts";
import "./notifications.ts";
import "./moderation.ts";
import "./eventsub.ts";
import "./watch.ts";

export { mapChatMessage } from "./chat-mapper.ts";

listen<string>("eventsub-error", (e) => {
  console.error("EventSub error:", e.payload);
});
