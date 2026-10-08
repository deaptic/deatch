import type { UiDensity } from "../../lib/constants/accessibility.ts";
import { appearanceUiDensity } from "../../lib/stores/preferences.ts";

// One height for rail rows and the chat composer box, so the two bottoms of
// the window line up at every density. `inner` is the box minus its border
// and padding: the band the composer's buttons centre in on a single line
// and stay pinned to at the bottom when the text grows.
const HEIGHTS: Record<UiDensity, { h: string; minH: string; inner: string }> = {
  compact: { h: "h-12", minH: "min-h-12", inner: "h-9.5" },
  default: { h: "h-14", minH: "min-h-14", inner: "h-11.5" },
  spacious: { h: "h-16", minH: "min-h-16", inner: "h-13.5" },
};

export const rowHeight = () => HEIGHTS[appearanceUiDensity()].h;
export const minRowHeight = () => HEIGHTS[appearanceUiDensity()].minH;
export const composerInnerHeight = () => HEIGHTS[appearanceUiDensity()].inner;
