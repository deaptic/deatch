import { produce } from "solid-js/store";
import {
  clampControl,
  type CompressorControl,
  DEFAULT_CHANNEL_GAIN,
  DEFAULT_COMPRESSOR,
} from "../../constants/audio.ts";
import { prefs, setPrefs } from "./core.ts";

export const linkAudioLink = () => prefs.link.audioLink;

export function setLinkAudioLink(value: boolean) {
  setPrefs("link", "audioLink", value);
}

export const linkCompressor = () => prefs.link.compressor;

export function setLinkCompressor(value: boolean) {
  setPrefs("link", "compressor", value);
}

export const compressorSettings = () => prefs.link.compressorSettings;

export function setCompressorControl(
  control: CompressorControl,
  value: number,
) {
  setPrefs("link", "compressorSettings", control, clampControl(control, value));
}

export function resetCompressorSettings() {
  setPrefs("link", "compressorSettings", { ...DEFAULT_COMPRESSOR });
}

export const linkChannelGains = () => prefs.link.channelGains;

export const channelGain = (login: string) =>
  prefs.link.channelGains[login] ?? DEFAULT_CHANNEL_GAIN;

/// A channel back at 100% is forgotten rather than stored.
export function setChannelGain(login: string, percent: number) {
  setPrefs(
    "link",
    "channelGains",
    produce((gains) => {
      if (percent === DEFAULT_CHANNEL_GAIN) delete gains[login];
      else gains[login] = percent;
    }),
  );
}
