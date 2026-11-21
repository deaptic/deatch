import { createSignal } from "solid-js";
import type { User } from "../types/index.ts";
import { emptyVisits, step, visit } from "../utils/visits.ts";
import { at } from "../utils/at.ts";

type ActiveView = "explore" | "settings" | User;

const [activeView, setActiveView] = createSignal<ActiveView>("explore");
export { activeView };

export const sameChannel = (a: User | null, b: User | null) =>
  (a?.id ?? null) === (b?.id ?? null);

export function pendingChannel(): User | null {
  const v = activeView();
  return typeof v === "string" ? null : v;
}

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

const [settingsSection, setSettingsSection] =
  createSignal<SettingsSection>("notifications");
export { setSettingsSection, settingsSection };

let beforeSettings: Exclude<ActiveView, "settings"> = "explore";

const [lastChannel, setLastChannel] = createSignal<User | null>(null);
export { lastChannel };

let visits = emptyVisits<User>();

export function recordVisit(channel: User) {
  visits = visit(visits, channel);
}

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

type JumpTarget = { broadcasterId: string; messageId: string };
export const [jumpTarget, setJumpTarget] = createSignal<JumpTarget | null>(
  null,
);

export const [linkSynced, setLinkSynced] = createSignal(false);
