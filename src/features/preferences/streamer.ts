import { prefs, setPrefs } from "./core.ts";

export const streamerMode = () => prefs.notifications.streamerMode;
export const streamerAuto = () => prefs.notifications.streamerAuto;

export function setStreamerMode(on: boolean) {
  setPrefs("notifications", "streamerMode", on);
}

export function setStreamerAuto(on: boolean) {
  setPrefs("notifications", "streamerAuto", on);
}
