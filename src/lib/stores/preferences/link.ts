import { persist, prefs, setPrefs } from "./core.ts";

export const linkAudioLink = () => prefs.link.audioLink;

export function setLinkAudioLink(value: boolean) {
  setPrefs("link", "audioLink", value);
  persist();
}
