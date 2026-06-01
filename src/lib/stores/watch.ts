import { createSignal } from "solid-js";
import type { User } from "../types/twitch/user.ts";

export const [watchConnected, setWatchConnected] = createSignal(false);
export const [watchedChannel, setWatchedChannel] = createSignal<User | null>(
  null,
);
export type WatchMode = "auto" | "manual";
export const [watchMode, setWatchMode] = createSignal<WatchMode | null>(null);

// Open Twitch tabs in the browser, pre-joined so Watch-tab swaps are instant.
export const [watchWarmedChannels, setWatchWarmedChannels] = createSignal<
  User[]
>([]);

export const [watchMutedByLogin, setWatchMutedByLogin] = createSignal<
  Record<string, boolean>
>({});
