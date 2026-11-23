import { remember } from "./recentChannels.ts";
import { prefs, setPrefs } from "./core.ts";

export const exploreLanguage = () => prefs.explore.language;

export function setExploreLanguage(language: string) {
  setPrefs("explore", "language", language);
}

export const recentChannels = () => prefs.explore.recent;

export function rememberChannel(id: string) {
  setPrefs("explore", "recent", (ids) => remember(ids, id));
}
