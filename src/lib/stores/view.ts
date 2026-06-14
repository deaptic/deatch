import { createMemo, createRoot, createSignal } from "solid-js";
import type { User } from "../types/twitch/user.ts";
import { createDebounced } from "../primitives/createDebounced.ts";

// The single source of truth for what the app is showing: the Explore page or
// a specific channel.
export type ActiveView = "explore" | User;

const [activeView, setActiveView] = createSignal<ActiveView>("explore");
export { activeView };

const sameId = (a: User | null, b: User | null) =>
  (a?.id ?? null) === (b?.id ?? null);

export const pendingChannel = createMemo<User | null>(
  () => {
    const v = activeView();
    return v === "explore" ? null : v;
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

export function showExplore() {
  setActiveView("explore");
  setWatchMode(null);
}

export function setSelectedChannel(channel: User) {
  setActiveView(channel);
}

// null: not watching. "auto": mirror whatever the browser tab is watching.
// "manual": locked onto a watched channel the user picked by cycling.
export type WatchMode = "auto" | "manual" | null;
export const [watchMode, setWatchMode] = createSignal<WatchMode>(null);
