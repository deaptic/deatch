import { formatCountdown } from "../../../shared/format/duration.ts";
import * as clock from "../../../lib/services/clock.ts";

export function untilIso(iso: string): string {
  return formatCountdown(Date.parse(iso) - clock.now());
}

export function untilMs(ms: number): string {
  return formatCountdown(ms - clock.now());
}
