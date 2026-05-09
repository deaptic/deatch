import { createSignal } from "solid-js";
import { loadUserPreferences, saveUserPreferences, type BadgePref, type EventPref } from "./preferences";
import type { BadgeCategoryKey, NotifKey } from "./constants";

const initial = loadUserPreferences();
const [fontSize, setFontSizeSignal] = createSignal(initial.feed.fontSize);
const [useDisplayName, setUseDisplayNameSignal] = createSignal(initial.feed.users.showDisplayName);
const [showTimestamp, setShowTimestampSignal] = createSignal(initial.feed.showTimestamp);
const [badgePrefs, setBadgePrefsSignal] = createSignal<Record<BadgeCategoryKey, BadgePref>>(
  initial.feed.badges as Record<BadgeCategoryKey, BadgePref>,
);
const [notifPrefs, setNotifPrefsSignal] = createSignal<Record<NotifKey, EventPref>>(
  initial.feed.events as Record<NotifKey, EventPref>,
);
const [mutedUsers, setMutedUsersSignal] = createSignal<string[]>(initial.feed.users.muted);
const [developerMode, setDeveloperModeSignal] = createSignal(initial.advanced.developerMode);

export { fontSize, useDisplayName, showTimestamp, badgePrefs, notifPrefs, mutedUsers, developerMode };

function clamp(v: number) {
  return Math.min(24, Math.max(11, v));
}

export function changeFontSize(delta: number) {
  setFontSize(fontSize() + delta);
}

export function setFontSize(value: number) {
  const next = clamp(value);
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

export function setBadgePrefs(value: Record<BadgeCategoryKey, BadgePref>) {
  const prefs = loadUserPreferences();
  saveUserPreferences({ ...prefs, feed: { ...prefs.feed, badges: value } });
  setBadgePrefsSignal(value);
}

export function setBadgePref(key: BadgeCategoryKey, show: boolean) {
  setBadgePrefs({ ...badgePrefs(), [key]: { show } });
}

export function setNotifPrefs(value: Record<NotifKey, EventPref>) {
  const prefs = loadUserPreferences();
  saveUserPreferences({ ...prefs, feed: { ...prefs.feed, events: value } });
  setNotifPrefsSignal(value);
}

export function setNotifPref(key: NotifKey, show: boolean) {
  setNotifPrefs({ ...notifPrefs(), [key]: { show } });
}

export function setMutedUsers(users: string[]) {
  const prefs = loadUserPreferences();
  saveUserPreferences({
    ...prefs,
    feed: { ...prefs.feed, users: { ...prefs.feed.users, muted: users } },
  });
  setMutedUsersSignal(users);
}

export function setDeveloperMode(value: boolean) {
  const prefs = loadUserPreferences();
  saveUserPreferences({
    ...prefs,
    advanced: { ...prefs.advanced, developerMode: value },
  });
  setDeveloperModeSignal(value);
}
