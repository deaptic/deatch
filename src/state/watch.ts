import { createSignal } from "solid-js";
import type { Channel } from "../types/composed";

export const [watchConnected, setWatchConnected] = createSignal(false);
export const [watchedChannel, setWatchedChannel] = createSignal<Channel | null>(null);
export const [watchActive, setWatchActive] = createSignal(false);

// Open Twitch tabs in the browser, pre-joined so Watch-tab swaps are instant.
export const [watchWarmedChannels, setWatchWarmedChannels] = createSignal<Channel[]>([]);
