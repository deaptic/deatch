import { produce } from "solid-js/store";
import { persist, prefs, setPrefs } from "./core.ts";

export const feedUserShowDisplayName = () => prefs.feed.users.showDisplayName;
export const feedUserOverrideNameColor = () =>
  prefs.feed.users.overrideNameColor;
export const feedUserMuted = () => prefs.feed.users.muted;
export const feedUserNicknames = () => prefs.feed.users.nicknames;
export const feedUserNickname = (login: string) =>
  prefs.feed.users.nicknames[login.toLowerCase()];

export function setFeedUserShowDisplayName(value: boolean) {
  setPrefs("feed", "users", "showDisplayName", value);
  persist();
}

export function setFeedUserOverrideNameColor(value: string) {
  setPrefs("feed", "users", "overrideNameColor", value);
  persist();
}

export function muteUser(user_id: string) {
  if (prefs.feed.users.muted.includes(user_id)) return;
  setPrefs("feed", "users", "muted", (m) => [...m, user_id]);
  persist();
}

export function unmuteUser(user_id: string) {
  setPrefs("feed", "users", "muted", (m) => m.filter((id) => id !== user_id));
  persist();
}

export function setUserNickname(login: string, nickname: string) {
  const key = login.trim().toLowerCase();
  const value = nickname.trim();
  if (!key) return;
  if (!value) {
    removeUserNickname(key);
    return;
  }
  setPrefs("feed", "users", "nicknames", key, value);
  persist();
}

export function removeUserNickname(login: string) {
  const key = login.trim().toLowerCase();
  if (!key) return;
  setPrefs(
    "feed",
    "users",
    "nicknames",
    produce((n) => {
      delete n[key];
    }),
  );
  persist();
}
