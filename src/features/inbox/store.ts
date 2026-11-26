import { createEffect, createRoot, createSignal, on } from "solid-js";
import * as mentions from "./mentions/store.ts";
import * as whispers from "./whispers/store.ts";
import * as whisperEvents from "./whispers/events.ts";
import type { UserRef } from "../../shared/types/index.ts";

export type Tab = "mentions" | "whispers";

const [tab, setTab] = createSignal<Tab>("mentions");
export { setTab, tab };

export const unreadCount = () =>
  mentions.unreadCount() + whispers.unreadCount();

export const openWhisper = (peer: UserRef): void => whispers.open(peer);

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
