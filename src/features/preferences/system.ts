import { prefs, setPrefs } from "./core.ts";

export const systemAutostart = () => prefs.system.autostart;
export const systemAlwaysOnTop = () => prefs.system.alwaysOnTop;
export const systemDiscordRichPresence = () => prefs.system.discordRichPresence;
export const systemHardwareAcceleration = () =>
  prefs.system.hardwareAcceleration;
export const systemFollowedChannels = () => prefs.system.followedChannels;

export function setSystemFollowedChannels(value: boolean) {
  setPrefs("system", "followedChannels", value);
}

export function setSystemAutostart(value: boolean) {
  setPrefs("system", "autostart", value);
}

export function setSystemAlwaysOnTop(value: boolean) {
  setPrefs("system", "alwaysOnTop", value);
}

export function setSystemDiscordRichPresence(value: boolean) {
  setPrefs("system", "discordRichPresence", value);
}

export function setSystemHardwareAcceleration(value: boolean) {
  setPrefs("system", "hardwareAcceleration", value);
}
