import type { Clock } from "../../shared/time.ts";
import { prefs, setPrefs } from "./core.ts";

export const generalAlwaysOnTop = () => prefs.general.alwaysOnTop;
export const generalAutostart = () => prefs.general.autostart;
export const generalDiscordRichPresence = () =>
  prefs.general.discordRichPresence;

export const generalClock = () => prefs.general.clock;

export function setGeneralClock(value: Clock) {
  setPrefs("general", "clock", value);
}

export function setGeneralAlwaysOnTop(value: boolean) {
  setPrefs("general", "alwaysOnTop", value);
}

export function setGeneralAutostart(value: boolean) {
  setPrefs("general", "autostart", value);
}

export function setGeneralDiscordRichPresence(value: boolean) {
  setPrefs("general", "discordRichPresence", value);
}
