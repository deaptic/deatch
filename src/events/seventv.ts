import { listen } from "@tauri-apps/api/event";
import { applySevenTvUpdate, type SevenTvUpdate } from "../services/emotes";

listen<SevenTvUpdate>("seventv-emote-set-updated", (e) => {
  applySevenTvUpdate(e.payload);
});
