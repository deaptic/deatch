import { persist, prefs, setPrefs } from "./core.ts";

export const feedUserShowDisplayName = () => prefs.feed.users.showDisplayName;
export const feedUserOverrideNameColor = () =>
  prefs.feed.users.overrideNameColor;

export function setFeedUserShowDisplayName(value: boolean) {
  setPrefs("feed", "users", "showDisplayName", value);
  persist();
}

export function setFeedUserOverrideNameColor(value: string) {
  setPrefs("feed", "users", "overrideNameColor", value);
  persist();
}
