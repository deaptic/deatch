import { getChatSettings } from "../api/twitch/chat.ts";
import { setChatSettings } from "../stores/chatSettings.ts";

export function load(broadcasterId: string): Promise<void> {
  return getChatSettings({ broadcasterId }, { silent: true }).then(
    (settings) => setChatSettings(broadcasterId, settings),
    () => {},
  );
}
