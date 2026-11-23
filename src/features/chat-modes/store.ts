import { createSignal } from "solid-js";
import {
  getChatSettings,
  updateChatSettings,
} from "../../platform/twitch/chat.ts";
import type {
  ChatSettings,
  UpdateChatSettingsParams,
} from "../../lib/types/index.ts";

export type ChatSettingsChange = Omit<
  UpdateChatSettingsParams,
  "broadcasterId"
>;

const [byChannel, setByChannel] = createSignal<Record<string, ChatSettings>>(
  {},
);

export function forChannel(broadcasterId: string): ChatSettings | undefined {
  return byChannel()[broadcasterId];
}

export function set(broadcasterId: string, settings: ChatSettings) {
  setByChannel((prev) => ({ ...prev, [broadcasterId]: settings }));
}

export function clear(broadcasterId: string) {
  setByChannel((prev) => {
    const { [broadcasterId]: _, ...rest } = prev;
    return rest;
  });
}

export function load(broadcasterId: string): Promise<void> {
  return getChatSettings({ broadcasterId }, { silent: true }).then(
    (settings) => set(broadcasterId, settings),
    () => {},
  );
}

export function update(broadcasterId: string, change: ChatSettingsChange) {
  updateChatSettings(
    { broadcasterId, ...change },
    { successMessage: false },
  ).catch(() => {});
}
