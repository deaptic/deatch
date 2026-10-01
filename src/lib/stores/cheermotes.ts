import { createSignal } from "solid-js";
import type { CheermoteMap } from "../utils/cheermote.ts";

const [byChannel, setByChannel] = createSignal<Record<string, CheermoteMap>>(
  {},
);

export function cheermotesFor(broadcasterId: string): CheermoteMap {
  return byChannel()[broadcasterId] ?? {};
}

export function hasCheermotes(broadcasterId: string): boolean {
  return broadcasterId in byChannel();
}

export function setCheermotes(broadcasterId: string, map: CheermoteMap) {
  setByChannel((prev) => ({ ...prev, [broadcasterId]: map }));
}

export function clearCheermotes(broadcasterId: string) {
  setByChannel((prev) => {
    const { [broadcasterId]: _, ...rest } = prev;
    return rest;
  });
}
