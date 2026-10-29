import { getChatSettings, updateChatSettings } from "../api/twitch/chat.ts";
import { setChatSettings } from "../stores/chatSettings.ts";
import type { UpdateChatSettingsParams } from "../types/index.ts";

export type ChatSettingsChange = Omit<
  UpdateChatSettingsParams,
  "broadcasterId"
>;

export function load(broadcasterId: string): Promise<void> {
  return getChatSettings({ broadcasterId }, { silent: true }).then(
    (settings) => setChatSettings(broadcasterId, settings),
    () => {},
  );
}

export function update(broadcasterId: string, change: ChatSettingsChange) {
  updateChatSettings(
    { broadcasterId, ...change },
    { successMessage: false },
  ).catch(() => {});
}
