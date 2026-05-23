import { createSignal } from "solid-js";
import type { User } from "../types/twitch/user";

export const [watchConnected, setWatchConnected] = createSignal(false);
export const [watchedChannel, setWatchedChannel] = createSignal<User | null>(null);
export const [watchActive, setWatchActive] = createSignal(false);

// Open Twitch tabs in the browser, pre-joined so Watch-tab swaps are instant.
export const [watchWarmedChannels, setWatchWarmedChannels] = createSignal<User[]>([]);
