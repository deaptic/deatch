import type { NonEmpty } from "../types/index.ts";

/// Ascending.
export type Stops = NonEmpty<number>;

export const FONT_SIZE_STOPS: Stops = [12, 14, 15, 16, 18, 20, 24];
export const GROUP_SPACING_STOPS: Stops = [0, 4, 8, 16, 24];
export const ZOOM_STOPS: Stops = [
  50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200,
];
export const DEFAULT_ZOOM = 100;

export const UI_DENSITIES = ["compact", "default", "spacious"] as const;
export type UiDensity = (typeof UI_DENSITIES)[number];

export function clampToStops(value: number, stops: Stops): number {
  return Math.min(Math.max(...stops), Math.max(Math.min(...stops), value));
}

export function nearestStop(value: number, stops: Stops): number {
  return stops.reduce((best, s) =>
    Math.abs(s - value) < Math.abs(best - value) ? s : best,
  );
}

export function stepStop(
  value: number,
  stops: Stops,
  direction: 1 | -1,
): number {
  const next =
    direction === 1
      ? stops.find((s) => s > value)
      : stops.findLast((s) => s < value);
  return next ?? value;
}

export function canStep(
  value: number,
  stops: Stops,
  direction: 1 | -1,
): boolean {
  return stepStop(value, stops, direction) !== value;
}
