import { createMemo, createSignal } from "solid-js";
import type { User } from "../types/twitch/user.ts";

// The single source of truth for what the app is showing: the Explore page or
// a specific channel.
export type ActiveView = "explore" | User;

const [activeView, setActiveView] = createSignal<ActiveView>("explore");
export { activeView };

export const selectedChannel = createMemo<User | null>(
  () => {
    const v = activeView();
    return v === "explore" ? null : v;
  },
  null,
  { equals: (a, b) => (a?.id ?? null) === (b?.id ?? null) },
);

export function showExplore() {
  setActiveView("explore");
}

export function setSelectedChannel(channel: User) {
  setActiveView(channel);
}

// null: not watching. "auto": mirror whatever the browser tab is watching.
// "manual": locked onto a watched channel the user picked by cycling.
export type WatchMode = "auto" | "manual" | null;
export const [watchMode, setWatchMode] = createSignal<WatchMode>(null);
