import type { UiDensity } from "../../lib/constants/accessibility.ts";
import { appearanceUiDensity } from "../../lib/stores/preferences.ts";

const HEIGHTS: Record<UiDensity, string> = {
  compact: "h-12",
  default: "h-14",
  spacious: "h-16",
};

export const railRowHeight = () => HEIGHTS[appearanceUiDensity()];
