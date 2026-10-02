export const FONT_SIZE_STOPS = [12, 14, 15, 16, 18, 20, 24];
export const GROUP_SPACING_STOPS = [0, 4, 8, 16, 24];
export const ZOOM_STOPS = [50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200];
export const DEFAULT_ZOOM = 100;

export const UI_DENSITIES = ["compact", "default", "spacious"] as const;
export type UiDensity = (typeof UI_DENSITIES)[number];

export function clampToStops(value: number, stops: readonly number[]): number {
  return Math.min(stops[stops.length - 1], Math.max(stops[0], value));
}

export function nearestStop(value: number, stops: readonly number[]): number {
  return stops.reduce((best, s) =>
    Math.abs(s - value) < Math.abs(best - value) ? s : best
  );
}

export function stepStop(
  value: number,
  stops: readonly number[],
  direction: 1 | -1,
): number {
  const next = direction === 1
    ? stops.find((s) => s > value)
    : stops.findLast((s) => s < value);
  return next ?? value;
}
