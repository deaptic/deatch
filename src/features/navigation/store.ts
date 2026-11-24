import { createSignal } from "solid-js";
import type { User } from "../../shared/types/index.ts";
import { emptyVisits, step, visit } from "./visits.ts";
import { at } from "../../shared/at.ts";
import {
  channelOf,
  leavePage as leaveNavigationPage,
  type Navigation,
  openChannel,
  openPage,
  startNavigation,
  toggleSettings as toggleNavigationSettings,
} from "./model.ts";

const [navigation, setNavigation] =
  createSignal<Navigation<User>>(startNavigation());

export const activeView = () => navigation().view;
export const lastChannel = () => navigation().last;

export const sameChannel = (a: User | null, b: User | null) =>
  (a?.id ?? null) === (b?.id ?? null);

export function pendingChannel(): User | null {
  return channelOf(activeView());
}

const [selectedChannel, commitSelectedChannel] = createSignal<User | null>(
  null,
  { equals: sameChannel },
);
export { commitSelectedChannel, selectedChannel };

export const isSettingsOpen = () => activeView() === "settings";

export type SettingsSection =
  | "general"
  | "account"
  | "appearance"
  | "link"
  | "keyboard"
  | "messages"
  | "notifications"
  | "moderation"
  | "triggers"
  | "developer";

const [settingsSection, setSettingsSection] =
  createSignal<SettingsSection>("general");
export { setSettingsSection, settingsSection };

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
  setNavigation((nav) => openPage(nav, "explore"));
  setLinkSynced(false);
}

export function showWhispers() {
  setNavigation((nav) => openPage(nav, "whispers"));
  setLinkSynced(false);
}

export function resetView() {
  visits = emptyVisits();
  setNavigation(startNavigation<User>());
  setLinkSynced(false);
}

export function setSelectedChannel(channel: User) {
  setNavigation((nav) => openChannel(nav, channel));
}

export function toggleSettings() {
  setNavigation(toggleNavigationSettings);
}

export function openSettings(section: SettingsSection) {
  setSettingsSection(section);
  if (!isSettingsOpen()) toggleSettings();
}

export function leavePage(): boolean {
  const next = leaveNavigationPage(navigation());
  if (next) setNavigation(next);
  return next !== null;
}

type JumpTarget = { broadcasterId: string; messageId: string };
export const [jumpTarget, setJumpTarget] = createSignal<JumpTarget | null>(
  null,
);

export const [linkSynced, setLinkSynced] = createSignal(false);
