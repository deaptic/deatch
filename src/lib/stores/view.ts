import { createMemo, createRoot, createSignal } from "solid-js";
import type { User } from "../types/index.ts";
import { createDebounced } from "../primitives/createDebounced.ts";

// The single source of truth for what the app is showing: a page or a channel.
export type ActiveView = "explore" | "settings" | User;

const [activeView, setActiveView] = createSignal<ActiveView>("explore");
export { activeView };

const sameId = (a: User | null, b: User | null) =>
  (a?.id ?? null) === (b?.id ?? null);

export const pendingChannel = createMemo<User | null>(
  () => {
    const v = activeView();
    return typeof v === "string" ? null : v;
  },
  null,
  { equals: sameId },
);

const CHANNEL_COMMIT_MS = 300;
export const selectedChannel: () => User | null = createRoot(() =>
  createDebounced(pendingChannel, CHANNEL_COMMIT_MS, {
    equals: sameId,
    immediate: (next, current) => next === null || current === null,
  })
);

export const isSettingsOpen = () => activeView() === "settings";

let beforeSettings: Exclude<ActiveView, "settings"> = "explore";

// The channel a page returns to, kept joined while a page is shown.
const [lastChannel, setLastChannel] = createSignal<User | null>(null);
export { lastChannel };

export function showExplore() {
  setActiveView("explore");
  setLinkSynced(false);
}

export function setSelectedChannel(channel: User) {
  setLastChannel(channel);
  setActiveView(channel);
}

export function toggleSettings() {
  const v = activeView();
  if (v === "settings") {
    setActiveView(beforeSettings);
    return;
  }
  beforeSettings = v;
  setActiveView("settings");
}

export function leavePage(): boolean {
  const v = activeView();
  if (v === "settings") {
    setActiveView(beforeSettings);
    return true;
  }
  const back = lastChannel();
  if (v === "explore" && back) {
    setActiveView(back);
    return true;
  }
  return false;
}

// A message to bring into view once its channel's feed holds it.
export type JumpTarget = { channelId: string; messageId: string };
export const [jumpTarget, setJumpTarget] = createSignal<JumpTarget | null>(
  null,
);

// Synced: the app and the browser's Twitch tab follow each other.
export const [linkSynced, setLinkSynced] = createSignal(false);
