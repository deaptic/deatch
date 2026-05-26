import { listen } from "@tauri-apps/api/event";

import "./auth";
import "./chat";
import "./notifications";
import "./moderation";
import "./eventsub";
import "./watch";

export { mapChatMessage } from "./chat-mapper";

listen<string>("eventsub-error", (e) => {
  console.error("EventSub error:", e.payload);
});
