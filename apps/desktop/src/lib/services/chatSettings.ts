import { getChatSettings } from "../api/twitch/chat.ts";
import { setChatSettings } from "../stores/chatSettings.ts";

export async function load(broadcasterId: string): Promise<void> {
  try {
    const settings = await getChatSettings({ broadcasterId }, { silent: true });
    setChatSettings(broadcasterId, settings);
  } catch (e) {
    console.warn(`chat settings for ${broadcasterId} unavailable`, e);
  }
}
