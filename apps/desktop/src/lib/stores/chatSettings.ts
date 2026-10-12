import { createSignal } from "solid-js";
import type { ChatSettings } from "../types/index.ts";

const [byChannel, setByChannel] = createSignal<Record<string, ChatSettings>>(
  {},
);

export function chatSettingsFor(
  broadcasterId: string,
): ChatSettings | undefined {
  return byChannel()[broadcasterId];
}

export function setChatSettings(broadcasterId: string, settings: ChatSettings) {
  setByChannel((prev) => ({ ...prev, [broadcasterId]: settings }));
}

export function clearChatSettings(broadcasterId: string) {
  setByChannel((prev) => {
    const { [broadcasterId]: _, ...rest } = prev;
    return rest;
  });
}
