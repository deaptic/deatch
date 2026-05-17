import { createSignal } from "solid-js";
import type { Channel } from "../types";

const [watchConnectedSig, setWatchConnectedSig] = createSignal(false);
export const watchConnected = watchConnectedSig;
export const setWatchConnected = setWatchConnectedSig;

const [watchedChannelSig, setWatchedChannelSig] = createSignal<Channel | null>(null);
export const watchedChannel = watchedChannelSig;
export const setWatchedChannel = setWatchedChannelSig;

const [watchActiveSig, setWatchActiveSig] = createSignal(false);
export const watchActive = watchActiveSig;
export const setWatchActive = setWatchActiveSig;

// Open Twitch tabs in the browser, pre-joined so Watch-tab swaps are instant.
const [watchWarmedSig, setWatchWarmedSig] = createSignal<Channel[]>([]);
export const watchWarmedChannels = watchWarmedSig;
export const setWatchWarmedChannels = setWatchWarmedSig;
