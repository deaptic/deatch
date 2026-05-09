import { createSignal } from "solid-js";
import { loadUserPreferences, saveUserPreferences } from "./preferences";

const initial = loadUserPreferences();
const [fontSize, setFontSizeSignal] = createSignal(initial.feed.fontSize);
const [useDisplayName, setUseDisplayNameSignal] = createSignal(initial.feed.users.showDisplayName);
const [developerMode, setDeveloperModeSignal] = createSignal(initial.advanced.developerMode);

export { fontSize, useDisplayName, developerMode };

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

export function setDeveloperMode(value: boolean) {
  const prefs = loadUserPreferences();
  saveUserPreferences({
    ...prefs,
    advanced: { ...prefs.advanced, developerMode: value },
  });
  setDeveloperModeSignal(value);
}
