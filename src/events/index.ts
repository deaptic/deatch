import { listen } from "@tauri-apps/api/event";
import type { UserEmote } from "../types";
import { appendUserEmotes } from "../state/emotes";

import "./auth";
import "./chat";
import "./notifications";
import "./moderation";
import "./eventsub";

export { mapChatMessage } from "./chat-mapper";

listen<string>("eventsub-error", (e) => {
  console.error("EventSub error:", e.payload);
});

listen<UserEmote[]>("user-emote-page", (e) => {
  appendUserEmotes(e.payload);
});
