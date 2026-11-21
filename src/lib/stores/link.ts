import { createSignal } from "solid-js";
import type { User } from "../types/index.ts";

export const [linkConnected, setLinkConnected] = createSignal(false);
export const [linkHasAudio, setLinkHasAudio] = createSignal(false);
export const [linkedChannel, setLinkedChannel] = createSignal<User | null>(
  null,
);

export const [linkWarmedChannels, setLinkWarmedChannels] = createSignal<User[]>(
  [],
);

export const [linkMutedByLogin, setLinkMutedByLogin] = createSignal<
  Record<string, boolean>
>({});
