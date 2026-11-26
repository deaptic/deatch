import { prefs, setPrefs } from "./core.ts";

export const linkEnabled = () => prefs.link.enabled;

export function setLinkEnabled(value: boolean) {
  setPrefs("link", "enabled", value);
}

export const linkAudioLink = () => prefs.link.audioLink;

export function setLinkAudioLink(value: boolean) {
  setPrefs("link", "audioLink", value);
}
