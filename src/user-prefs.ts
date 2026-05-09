import { createSignal } from "solid-js";
import { loadUserPreferences, saveUserPreferences, type BadgePref, type EventPref } from "./preferences";
import type { BadgeCategoryKey, EventKey } from "./constants";

const initial = loadUserPreferences();
const [fontSize, setFontSizeSignal] = createSignal(initial.feed.fontSize);
const [useDisplayName, setUseDisplayNameSignal] = createSignal(initial.feed.users.showDisplayName);
const [showTimestamp, setShowTimestampSignal] = createSignal(initial.feed.showTimestamp);
const [badgePrefs, setBadgePrefsSignal] = createSignal<Record<BadgeCategoryKey, BadgePref>>(
  initial.feed.badges as Record<BadgeCategoryKey, BadgePref>,
);
const [eventPrefs, setEventPrefsSignal] = createSignal<Record<EventKey, EventPref>>(
  initial.feed.events as Record<EventKey, EventPref>,
);
const [mutedUsers, setMutedUsersSignal] = createSignal<string[]>(initial.feed.users.muted);
const [pinnedChannels, setPinnedChannelsSignal] = createSignal<string[]>(initial.menu.channels.pinned);
const [developerMode, setDeveloperModeSignal] = createSignal(initial.advanced.developerMode);

export {
  fontSize,
  useDisplayName,
  showTimestamp,
  badgePrefs,
  eventPrefs,
  mutedUsers,
  pinnedChannels,
  developerMode,
};

export function setFontSize(value: number) {
  const next = Math.min(24, Math.max(11, value));
  const prefs = loadUserPreferences();
  saveUserPreferences({ ...prefs, feed: { ...prefs.feed, fontSize: next } });
  setFontSizeSignal(next);
}

export function setUseDisplayName(value: boolean) {
  const prefs = loadUserPreferences();
  saveUserPreferences({
    ...prefs,
    feed: { ...prefs.feed, users: { ...prefs.feed.users, showDisplayName: value } },
  });
  setUseDisplayNameSignal(value);
}

export function setShowTimestamp(value: boolean) {
  const prefs = loadUserPreferences();
  saveUserPreferences({ ...prefs, feed: { ...prefs.feed, showTimestamp: value } });
  setShowTimestampSignal(value);
}

export function setBadgePref(key: BadgeCategoryKey, show: boolean) {
  const next = { ...badgePrefs(), [key]: { show } };
  const prefs = loadUserPreferences();
  saveUserPreferences({ ...prefs, feed: { ...prefs.feed, badges: next } });
  setBadgePrefsSignal(next);
}

export function setEventPref(key: EventKey, show: boolean) {
  const next = { ...eventPrefs(), [key]: { show } };
  const prefs = loadUserPreferences();
  saveUserPreferences({ ...prefs, feed: { ...prefs.feed, events: next } });
  setEventPrefsSignal(next);
}

export function muteUser(login: string) {
  if (mutedUsers().includes(login)) return;
  const next = [...mutedUsers(), login];
  const prefs = loadUserPreferences();
  saveUserPreferences({
    ...prefs,
    feed: { ...prefs.feed, users: { ...prefs.feed.users, muted: next } },
  });
  setMutedUsersSignal(next);
}

export function unmuteUser(login: string) {
  const next = mutedUsers().filter((n) => n !== login);
  const prefs = loadUserPreferences();
  saveUserPreferences({
    ...prefs,
    feed: { ...prefs.feed, users: { ...prefs.feed.users, muted: next } },
  });
  setMutedUsersSignal(next);
}

function savePinned(value: string[]) {
  const prefs = loadUserPreferences();
  saveUserPreferences({
    ...prefs,
    menu: { ...prefs.menu, channels: { ...prefs.menu.channels, pinned: value } },
  });
  setPinnedChannelsSignal(value);
}

export function pinChannel(user_id: string) {
  if (pinnedChannels().includes(user_id)) return;
  savePinned([...pinnedChannels(), user_id]);
}

export function unpinChannel(user_id: string) {
  savePinned(pinnedChannels().filter((id) => id !== user_id));
}

export function reorderPinnedChannels(from: number, to: number) {
  if (from === to) return;
  const next = [...pinnedChannels()];
  const [item] = next.splice(from, 1);
  next.splice(from < to ? to - 1 : to, 0, item);
  savePinned(next);
}

export function setDeveloperMode(value: boolean) {
  const prefs = loadUserPreferences();
  saveUserPreferences({
    ...prefs,
    advanced: { ...prefs.advanced, developerMode: value },
  });
  setDeveloperModeSignal(value);
}
