export const TOOLTIP_DELAY_MS = 700;
const STAYS_WARM_MS = 400;

let warmUntil = 0;

export const isWarm = () => performance.now() < warmUntil;

export function coolDown(): void {
  warmUntil = performance.now() + STAYS_WARM_MS;
}
