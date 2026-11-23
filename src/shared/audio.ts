export const MAX_CHANNEL_GAIN = 200;
export const DEFAULT_CHANNEL_GAIN = 100;

export const COMPRESSOR = {
  threshold: { min: -60, max: 0, step: 1, initial: -27 },
  ratio: { min: 1, max: 4.5, step: 0.1, initial: 3.2 },
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

export function clampControl(control: CompressorControl, value: number) {
  const { min, max, step } = COMPRESSOR[control];
  const stepped = Math.round(value / step) * step;
  return Number(Math.min(max, Math.max(min, stepped)).toFixed(2));
}
