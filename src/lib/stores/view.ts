import { createSignal } from "solid-js";
import type { User } from "../types/index.ts";
import { emptyVisits, step, visit } from "../utils/visits.ts";
import { at } from "../utils/at.ts";

// The single source of truth for what the app is showing: a page or a channel.
type ActiveView = "explore" | "settings" | User;

const [activeView, setActiveView] = createSignal<ActiveView>("explore");
export { activeView };

export const sameChannel = (a: User | null, b: User | null) =>
  (a?.id ?? null) === (b?.id ?? null);

/// The channel being shown right now, ahead of `selectedChannel`.
export function pendingChannel(): User | null {
  const v = activeView();
  return typeof v === "string" ? null : v;
}

/// `pendingChannel` once it settles; the view service commits it.
const [selectedChannel, commitSelectedChannel] = createSignal<User | null>(
  null,
  { equals: sameChannel },
);
export { commitSelectedChannel, selectedChannel };

export const isSettingsOpen = () => activeView() === "settings";

export type SettingsSection =
  | "notifications"
  | "moderation"
  | "triggers"
  | "appearance"
  | "link"
  | "keyboard"
  | "advanced";

// Kept here so the page opens where it was left, or where a shortcut points.
const [settingsSection, setSettingsSection] =
  createSignal<SettingsSection>("notifications");
export { setSettingsSection, settingsSection };

let beforeSettings: Exclude<ActiveView, "settings"> = "explore";

// The channel a page returns to, kept joined while a page is shown.
const [lastChannel, setLastChannel] = createSignal<User | null>(null);
export { lastChannel };

let visits = emptyVisits<User>();

export function recordVisit(channel: User) {
  visits = visit(visits, channel);
}

/// Moves `delta` steps through visited channels, returning the one to show.
export function stepVisits(delta: 1 | -1): User | null {
  const next = step(visits, delta);
  if (!next) return null;
  visits = next;
  return at(next.entries, next.index);
}

export function showExplore() {
  setActiveView("explore");
  setLinkSynced(false);
}

export function resetView() {
  visits = emptyVisits();
  setLastChannel(null);
  beforeSettings = "explore";
  showExplore();
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

/// Shows Settings on `section`, opening the page if it is closed.
export function openSettings(section: SettingsSection) {
  setSettingsSection(section);
  if (!isSettingsOpen()) toggleSettings();
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
type JumpTarget = { broadcasterId: string; messageId: string };
export const [jumpTarget, setJumpTarget] = createSignal<JumpTarget | null>(
  null,
);

// Synced: the app and the browser's Twitch tab follow each other.
export const [linkSynced, setLinkSynced] = createSignal(false);
