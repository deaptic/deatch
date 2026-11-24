import { formatCountdown } from "../../../../shared/format/duration.ts";

export function untilIso(iso: string, now: number): string {
  return formatCountdown(Date.parse(iso) - now);
}

export function untilMs(ms: number, now: number): string {
  return formatCountdown(ms - now);
}
