/// A channel's gain in percent; 100 leaves it as it is.
export const MAX_CHANNEL_GAIN = 200;
export const DEFAULT_CHANNEL_GAIN = 100;

/// The compressor's controls, in the units the listener sees: threshold and
/// gain in dB, ratio as N:1, attack and release in milliseconds.
export const COMPRESSOR = {
  threshold: { min: -60, max: 0, step: 1, initial: -27 },
  ratio: { min: 1, max: 4.5, step: 0.1, initial: 3.2 },
  // The browser's compressor treats any attack under 1 ms as 1 ms, and its
  // adaptive release turns a release under 50 ms into distortion.
  attack: { min: 1, max: 50, step: 1, initial: 3 },
  release: { min: 50, max: 1000, step: 10, initial: 250 },
  gain: { min: -12, max: 12, step: 0.5, initial: 0 },
} as const;

export type CompressorControl = keyof typeof COMPRESSOR;
export type CompressorSettings = Record<CompressorControl, number>;

export const COMPRESSOR_CONTROLS = Object.keys(
  COMPRESSOR,
) as CompressorControl[];

export const DEFAULT_COMPRESSOR = Object.fromEntries(
  COMPRESSOR_CONTROLS.map((control) => [control, COMPRESSOR[control].initial]),
) as CompressorSettings;

/// A control's value kept inside its range, on its step.
export function clampControl(control: CompressorControl, value: number) {
  const { min, max, step } = COMPRESSOR[control];
  const stepped = Math.round(value / step) * step;
  return Number(Math.min(max, Math.max(min, stepped)).toFixed(2));
}
