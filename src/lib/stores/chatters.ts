import { createSignal } from "solid-js";
import type { UserRef } from "../types/index.ts";

export type ChatterList = {
  chatters: UserRef[];
  total: number;
  cursor: string | null;
  moderators: string[];
  vips: string[];
};

const EMPTY: ChatterList = {
  chatters: [],
  total: 0,
  cursor: null,
  moderators: [],
  vips: [],
};

const [byChannel, setByChannel] = createSignal<Record<string, ChatterList>>({});

export function chatterListFor(broadcasterId: string): ChatterList {
  return byChannel()[broadcasterId] ?? EMPTY;
}

export function updateChatterList(
  broadcasterId: string,
  change: Partial<ChatterList>,
) {
  setByChannel((prev) => ({
    ...prev,
    [broadcasterId]: { ...(prev[broadcasterId] ?? EMPTY), ...change },
  }));
}
