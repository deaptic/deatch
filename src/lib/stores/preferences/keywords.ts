import { prefs, setPrefs } from "./core.ts";

export const feedKeywords = () => prefs.feed.keywords;

export function addFeedKeyword(keyword: string) {
  const lower = keyword.trim().toLowerCase();
  if (!lower) return;
  if (prefs.feed.keywords.some((k) => k.toLowerCase() === lower)) return;
  setPrefs("feed", "keywords", (k) => [...k, lower]);
}

export function removeFeedKeyword(keyword: string) {
  setPrefs("feed", "keywords", (k) => k.filter((x) => x !== keyword));
}
