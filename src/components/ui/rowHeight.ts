import type { UiDensity } from "../../lib/constants/accessibility.ts";
import { appearanceUiDensity } from "../../lib/stores/preferences.ts";

const HEIGHTS: Record<UiDensity, { row: string; minH: string; inner: string }> =
  {
    compact: { row: "h-12", minH: "min-h-12", inner: "h-9.5" },
    default: { row: "h-14", minH: "min-h-14", inner: "h-11.5" },
    spacious: { row: "h-16", minH: "min-h-16", inner: "h-13.5" },
  };

const RAIL_GAPS: Record<UiDensity, string> = {
  compact: "gap-0",
  default: "gap-1",
  spacious: "gap-2",
};

export const railRowHeight = () => HEIGHTS[appearanceUiDensity()].row;
export const railGap = () => RAIL_GAPS[appearanceUiDensity()];
export const minRowHeight = () => HEIGHTS[appearanceUiDensity()].minH;
export const composerInnerHeight = () => HEIGHTS[appearanceUiDensity()].inner;
