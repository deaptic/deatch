import { prefs, setPrefs } from "./core.ts";

export const advancedDeveloperMode = () => prefs.advanced.developerMode;
export const advancedShowLogs = () => prefs.advanced.showLogs;
export const advancedAlwaysOnTop = () => prefs.advanced.alwaysOnTop;
export const advancedAutostart = () => prefs.advanced.autostart;
export const advancedDiscordRichPresence = () =>
  prefs.advanced.discordRichPresence;
export const advancedHardwareAcceleration = () =>
  prefs.advanced.hardwareAcceleration;

export function setAdvancedDeveloperMode(value: boolean) {
  setPrefs("advanced", "developerMode", value);
}

export function setAdvancedShowLogs(value: boolean) {
  setPrefs("advanced", "showLogs", value);
}

export function setAdvancedAlwaysOnTop(value: boolean) {
  setPrefs("advanced", "alwaysOnTop", value);
}

export function setAdvancedAutostart(value: boolean) {
  setPrefs("advanced", "autostart", value);
}

export function setAdvancedDiscordRichPresence(value: boolean) {
  setPrefs("advanced", "discordRichPresence", value);
}

export function setAdvancedHardwareAcceleration(value: boolean) {
  setPrefs("advanced", "hardwareAcceleration", value);
}
