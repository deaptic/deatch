import { createSignal } from "solid-js";
import { getCheermotes } from "../../platform/twitch/bits.ts";
import * as channels from "../channels/index.ts";
import { buildCheermoteMap, type CheermoteMap } from "./cheermoteMap.ts";

const [byChannel, setByChannel] = createSignal<Record<string, CheermoteMap>>(
  {},
);

export function forChannel(broadcasterId: string): CheermoteMap {
  return byChannel()[broadcasterId] ?? {};
}

function clear(broadcasterId: string) {
  setByChannel((prev) => {
    const { [broadcasterId]: _, ...rest } = prev;
    return rest;
  });
}

async function load(broadcasterId: string): Promise<void> {
  if (broadcasterId in byChannel()) return;
  await getCheermotes({ broadcasterId }, { silent: true }).then(
    (cheermotes) =>
      setByChannel((prev) => ({
        ...prev,
        [broadcasterId]: buildCheermoteMap(cheermotes),
      })),
    () => {},
  );
}

export function start(): () => void {
  return channels.onChannel({ join: (id) => void load(id), leave: clear });
}
