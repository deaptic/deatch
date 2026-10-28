import { listenEventSub, unlistenAll } from "./listen.ts";
import type { RawChatSettingsUpdate } from "../types/index.ts";
import { setChatSettings } from "../stores/chatSettings.ts";
import { mapChatSettingsUpdate } from "../mappers/chatSettings.ts";

export function start(): () => void {
  return unlistenAll([
    listenEventSub<RawChatSettingsUpdate>(
      "channel.chat_settings.update",
      (e) => {
        const raw = e.event;
        setChatSettings(raw.broadcaster_user_id, mapChatSettingsUpdate(raw));
      },
    ),
  ]);
}
