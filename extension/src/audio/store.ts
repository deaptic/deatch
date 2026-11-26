import { onStored } from "../shared/storage.ts";
import { type Audio, clamp, MAX_CHANNEL_GAIN, readAudio } from "./settings.ts";

export async function loadAudio(): Promise<Audio> {
  const { audio } = await chrome.storage.local.get("audio");
  return readAudio(audio);
}

export async function updateAudio(
  change: (audio: Audio) => Audio,
): Promise<Audio> {
  const next = change(await loadAudio());
  await chrome.storage.local.set({ audio: next });
  return next;
}

export function setChannelGain(channel: string, gain: number) {
  return updateAudio((audio) => {
    const gains = { ...audio.gains };
    if (gain === 1) delete gains[channel];
    else gains[channel] = clamp(gain, 0, MAX_CHANNEL_GAIN);
    return { ...audio, gains };
  });
}

export function onAudio(listener: (audio: Audio) => void) {
  onStored("audio", (stored) => listener(readAudio(stored)));
}
