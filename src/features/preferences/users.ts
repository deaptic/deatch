import { prefs, setPrefs } from "./core.ts";

export const feedUserShowDisplayName = () => prefs.feed.users.showDisplayName;
export const feedUserOverrideNameColor = () =>
  prefs.feed.users.overrideNameColor;

export function setFeedUserShowDisplayName(value: boolean) {
  setPrefs("feed", "users", "showDisplayName", value);
}

export function setFeedUserOverrideNameColor(value: string) {
  setPrefs("feed", "users", "overrideNameColor", value);
}
