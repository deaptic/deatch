import { asRecord, isFiniteNumber } from "../shared/record.ts";

export type ControlName = "threshold" | "ratio" | "attack" | "release" | "gain";
type Control = { min: number; max: number; step: number; initial: number };
export type Compressor = Record<ControlName, number>;
export type Audio = {
  enabled: boolean;
  compressor: Compressor;
  gains: Record<string, number>;
};

export const CONTROLS: Record<ControlName, Control> = {
  threshold: { min: -60, max: 0, step: 1, initial: -27 },
  ratio: { min: 1, max: 4.5, step: 0.1, initial: 3.2 },
  attack: { min: 1, max: 50, step: 1, initial: 3 },
  release: { min: 50, max: 1000, step: 10, initial: 250 },
  gain: { min: -12, max: 12, step: 0.5, initial: 0 },
};
export const CONTROL_NAMES = Object.keys(CONTROLS) as ControlName[];
export const MAX_CHANNEL_GAIN = 2;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function compressorOf(
  pick: (name: ControlName, control: Control) => number,
): Compressor {
  return Object.fromEntries(
    CONTROL_NAMES.map((name) => [name, pick(name, CONTROLS[name])]),
  ) as Compressor;
}

export const initialCompressor = () => compressorOf((_, c) => c.initial);

export function readAudio(stored: unknown): Audio {
  const audio = asRecord(stored);
  const saved = asRecord(audio.compressor);
  const compressor = compressorOf((name, c) => {
    const value = saved[name];
    return isFiniteNumber(value) ? clamp(value, c.min, c.max) : c.initial;
  });
  const gains: Record<string, number> = {};
  for (const [name, gain] of Object.entries(asRecord(audio.gains))) {
    if (isFiniteNumber(gain) && gain !== 1) {
      gains[name] = clamp(gain, 0, MAX_CHANNEL_GAIN);
    }
  }
  return { enabled: audio.enabled === true, compressor, gains };
}

export function gainOf(audio: Audio, channel: string | null): number {
  if (!channel || !Object.hasOwn(audio.gains, channel)) return 1;
  return audio.gains[channel] ?? 1;
}

export type AudioFeatures = {
  gainControl: boolean;
  compressorControl: boolean;
};

export function effectiveAudio(audio: Audio, features: AudioFeatures): Audio {
  return {
    ...audio,
    enabled: audio.enabled && features.compressorControl,
    gains: features.gainControl ? audio.gains : {},
  };
}
