import { persist, prefs, setPrefs } from "./core.ts";

export const exploreLanguage = () => prefs.explore.language;

export function setExploreLanguage(language: string) {
  setPrefs("explore", "language", language);
  persist();
}
