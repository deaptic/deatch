import type { UiDensity } from "../../lib/constants/accessibility.ts";
import { appearanceUiDensity } from "../../lib/stores/preferences.ts";

// `inner` is the composer box minus its border and padding: the band its
// buttons centre in on a single line and stay pinned to at the bottom when
// the text grows.
const HEIGHTS: Record<UiDensity, { minH: string; inner: string }> = {
  compact: { minH: "min-h-12", inner: "h-9.5" },
  default: { minH: "min-h-14", inner: "h-11.5" },
  spacious: { minH: "min-h-16", inner: "h-13.5" },
};

// Rail rows are a fixed field around the tile; density only changes the gap
// between them.
const RAIL_GAPS: Record<UiDensity, string> = {
  compact: "gap-0",
  default: "gap-1",
  spacious: "gap-2",
};

export const rowHeight = () => "h-14";
export const railGap = () => RAIL_GAPS[appearanceUiDensity()];
export const minRowHeight = () => HEIGHTS[appearanceUiDensity()].minH;
export const composerInnerHeight = () => HEIGHTS[appearanceUiDensity()].inner;
