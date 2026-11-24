import { prefs, setPrefs } from "./core.ts";

export const highlightWords = () => prefs.notifications.keywords;

export function addHighlightWord(word: string) {
  const lower = word.trim().toLowerCase();
  if (!lower) return;
  if (prefs.notifications.keywords.some((k) => k.toLowerCase() === lower))
    return;
  setPrefs("notifications", "keywords", (k) => [...k, lower]);
}

export function removeHighlightWord(word: string) {
  setPrefs("notifications", "keywords", (k) => k.filter((x) => x !== word));
}
