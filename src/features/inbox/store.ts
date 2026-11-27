import { createEffect, createRoot, on } from "solid-js";
import * as mentions from "./mentions/store.ts";
import * as whispers from "./whispers/store.ts";
import * as whisperEvents from "./whispers/events.ts";
import type { UserRef } from "../../shared/types/index.ts";

import { setTab } from "./tab.ts";

export { setTab, tab, type Tab } from "./tab.ts";

export const unreadCount = () =>
  mentions.unreadCount() + whispers.unreadCount();

export const openWhisper = (peer: UserRef): void => whispers.open(peer);

export const newMentions = () => mentions.shown().filter((m) => m.unread);
export const earlierMentions = () => mentions.shown().filter((m) => !m.unread);
export function mentionsSince(timestamp: number): Record<string, number> {
  const byChannel: Record<string, number> = {};
  for (const m of mentions.shown()) {
    if (m.timestamp >= timestamp) {
      byChannel[m.broadcasterId] = (byChannel[m.broadcasterId] ?? 0) + 1;
    }
  }
  return byChannel;
}

export function start(): () => void {
  const stops = [mentions.start(), whisperEvents.start()];
  const dispose = createRoot((dispose) => {
    createEffect(
      on(whispers.openPeer, (peer) => {
        if (peer) setTab("whispers");
      }),
    );
    return dispose;
  });
  return () => {
    dispose();
    for (const stop of stops) stop();
  };
}
