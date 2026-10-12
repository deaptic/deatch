import { persist, prefs, setPrefs } from "./core.ts";

export const advancedDeveloperMode = () => prefs.advanced.developerMode;
export const advancedShowLogs = () => prefs.advanced.showLogs;
export const advancedAlwaysOnTop = () => prefs.advanced.alwaysOnTop;
export const advancedAutostart = () => prefs.advanced.autostart;
export const advancedDiscordRichPresence = () =>
  prefs.advanced.discordRichPresence;

export function setAdvancedDeveloperMode(value: boolean) {
  setPrefs("advanced", "developerMode", value);
  persist();
}

export function setAdvancedShowLogs(value: boolean) {
  setPrefs("advanced", "showLogs", value);
  persist();
}

export function setAdvancedAlwaysOnTop(value: boolean) {
  setPrefs("advanced", "alwaysOnTop", value);
  persist();
}

export function setAdvancedAutostart(value: boolean) {
  setPrefs("advanced", "autostart", value);
  persist();
}

export function setAdvancedDiscordRichPresence(value: boolean) {
  setPrefs("advanced", "discordRichPresence", value);
  persist();
}
