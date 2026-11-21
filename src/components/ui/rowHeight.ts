import type { UiDensity } from "../../lib/constants/accessibility.ts";
import { appearanceUiDensity } from "../../lib/stores/preferences.ts";

const HEIGHTS: Record<UiDensity, { minH: string; inner: string }> = {
  compact: { minH: "min-h-12", inner: "h-9.5" },
  default: { minH: "min-h-14", inner: "h-11.5" },
  spacious: { minH: "min-h-16", inner: "h-13.5" },
};

const RAIL_GAPS: Record<UiDensity, string> = {
  compact: "gap-0",
  default: "gap-1",
  spacious: "gap-2",
};

export const RAIL_ROW_HEIGHT = "h-14";
export const railGap = () => RAIL_GAPS[appearanceUiDensity()];
export const minRowHeight = () => HEIGHTS[appearanceUiDensity()].minH;
export const composerInnerHeight = () => HEIGHTS[appearanceUiDensity()].inner;
