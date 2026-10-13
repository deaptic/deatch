export const TIMEOUT_PRESETS = [
  { label: "1s", seconds: 1 },
  { label: "1m", seconds: 60 },
  { label: "10m", seconds: 600 },
  { label: "1h", seconds: 3600 },
  { label: "1d", seconds: 86400 },
  { label: "1w", seconds: 604800 },
] as const;

export type TimeoutLabel = (typeof TIMEOUT_PRESETS)[number]["label"];
