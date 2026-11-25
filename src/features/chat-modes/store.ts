import { createSignal } from "solid-js";
import {
  getChatSettings,
  updateChatSettings,
} from "../../platform/twitch/chat.ts";
import type {
  ChatSettings,
  UpdateChatSettingsParams,
} from "../../shared/types/index.ts";

export type ChatSettingsChange = Omit<
  UpdateChatSettingsParams,
  "broadcasterId"
>;

const [byChannel, setByChannel] = createSignal<Record<string, ChatSettings>>(
  {},
);

const versions = new Map<string, number>();
const bump = (broadcasterId: string) =>
  versions.set(broadcasterId, (versions.get(broadcasterId) ?? 0) + 1);

export function forChannel(broadcasterId: string): ChatSettings | undefined {
  return byChannel()[broadcasterId];
}

export function set(broadcasterId: string, settings: ChatSettings) {
  bump(broadcasterId);
  setByChannel((prev) => ({ ...prev, [broadcasterId]: settings }));
}

export function clear(broadcasterId: string) {
  bump(broadcasterId);
  setByChannel((prev) => {
    const { [broadcasterId]: _, ...rest } = prev;
    return rest;
  });
}

export function load(broadcasterId: string): Promise<void> {
  const version = versions.get(broadcasterId);
  return getChatSettings({ broadcasterId }, { silent: true }).then(
    (settings) => {
      if (versions.get(broadcasterId) === version) set(broadcasterId, settings);
    },
    () => {},
  );
}

export function update(broadcasterId: string, change: ChatSettingsChange) {
  updateChatSettings(
    { broadcasterId, ...change },
    { successMessage: false },
  ).catch(() => {});
}
