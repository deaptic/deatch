export const TIMEOUT_PRESETS = [
  { label: "1s", seconds: 1 },
  { label: "1m", seconds: 60 },
  { label: "10m", seconds: 600 },
  { label: "1h", seconds: 3600 },
  { label: "1d", seconds: 86400 },
  { label: "1w", seconds: 604800 },
] as const;

export type TimeoutLabel = (typeof TIMEOUT_PRESETS)[number]["label"];

/// A preset label picks a timeout; "ban" and "unban" are the two ends.
export type BanChoice = "unban" | "ban" | TimeoutLabel;

/// Seconds for a timeout, null for a permanent ban.
export function secondsFor(choice: Exclude<BanChoice, "unban">): number | null {
  if (choice === "ban") return null;
  const preset = TIMEOUT_PRESETS.find((p) => p.label === choice);
  if (!preset) throw new Error(`unknown timeout preset: ${choice}`);
  return preset.seconds;
}
