import { prefs, setPrefs } from "./core.ts";

export const developerMode = () => prefs.developer.mode;
export const developerShowLogs = () => prefs.developer.showLogs;

export function setDeveloperMode(value: boolean) {
  setPrefs("developer", "mode", value);
}

export function setDeveloperShowLogs(value: boolean) {
  setPrefs("developer", "showLogs", value);
}
