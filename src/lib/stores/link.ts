import { createSignal } from "solid-js";
import type { User } from "../types/index.ts";

export const [linkConnected, setLinkConnected] = createSignal(false);
// A connected browser's extension can process audio; older ones can't.
export const [linkHasAudio, setLinkHasAudio] = createSignal(false);
export const [linkedChannel, setLinkedChannel] = createSignal<User | null>(
  null,
);

// Open Twitch tabs in the browser, pre-joined so Link-tab swaps are instant.
export const [linkWarmedChannels, setLinkWarmedChannels] = createSignal<
  User[]
>([]);

export const [linkMutedByLogin, setLinkMutedByLogin] = createSignal<
  Record<string, boolean>
>({});
