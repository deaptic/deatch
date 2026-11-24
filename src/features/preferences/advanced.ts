import { prefs, setPrefs } from "./core.ts";

export const advancedDeveloperMode = () => prefs.advanced.developerMode;
export const advancedShowLogs = () => prefs.advanced.showLogs;
export const advancedHardwareAcceleration = () =>
  prefs.advanced.hardwareAcceleration;

export function setAdvancedDeveloperMode(value: boolean) {
  setPrefs("advanced", "developerMode", value);
}

export function setAdvancedShowLogs(value: boolean) {
  setPrefs("advanced", "showLogs", value);
}

export function setAdvancedHardwareAcceleration(value: boolean) {
  setPrefs("advanced", "hardwareAcceleration", value);
}
