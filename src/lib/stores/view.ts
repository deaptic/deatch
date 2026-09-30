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
let lastChannel: User | null = null;

export function showExplore() {
  setActiveView("explore");
  setWatchMode(null);
}

export function setSelectedChannel(channel: User) {
  lastChannel = channel;
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
  if (v === "explore" && lastChannel) {
    setActiveView(lastChannel);
    return true;
  }
  return false;
}

// null: not watching. "auto": mirror whatever the browser tab is watching.
// "manual": locked onto a watched channel the user picked by cycling.
export type WatchMode = "auto" | "manual" | null;
export const [watchMode, setWatchMode] = createSignal<WatchMode>(null);
