import { listenEventSub, unlistenAll } from "../../lib/events/listen.ts";
import type { RawChatSettingsUpdate } from "../../lib/types/index.ts";
import * as channels from "../channels/index.ts";
import { mapChatSettingsUpdate } from "./model.ts";
import { clear, load, set } from "./store.ts";

export function start(): () => void {
  const stopListening = unlistenAll([
    listenEventSub<RawChatSettingsUpdate>(
      "channel.chat_settings.update",
      (e) => {
        const raw = e.event;
        set(raw.broadcaster_user_id, mapChatSettingsUpdate(raw));
      },
    ),
  ]);
  const stopHooks = channels.onChannel({
    join: (id) => void load(id),
    focus: (id) => void load(id),
    leave: clear,
  });
  return () => {
    stopListening();
    stopHooks();
  };
}
