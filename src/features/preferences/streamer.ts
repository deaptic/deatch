import { prefs, setPrefs } from "./core.ts";

export const streamerMode = () => prefs.streamer.on;
export const streamerAuto = () => prefs.streamer.auto;

export function setStreamerMode(on: boolean) {
  setPrefs("streamer", "on", on);
}

export function setStreamerAuto(on: boolean) {
  setPrefs("streamer", "auto", on);
}
