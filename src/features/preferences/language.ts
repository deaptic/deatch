import type { Language } from "../../shared/i18n/index.ts";
import type { Clock } from "../../shared/time.ts";
import { prefs, setPrefs } from "./core.ts";

export const appLanguage = () => prefs.language.app;
export const timeFormat = () => prefs.language.clock;

export function setAppLanguage(language: Language) {
  setPrefs("language", "app", language);
}

export function setTimeFormat(clock: Clock) {
  setPrefs("language", "clock", clock);
}
