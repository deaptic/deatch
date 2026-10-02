import type { Theme } from "../../constants/theme.ts";
import {
  clampToStops,
  DEFAULT_ZOOM,
  stepStop,
  type UiDensity,
  ZOOM_STOPS,
} from "../../constants/accessibility.ts";
import { persist, prefs, setPrefs } from "./core.ts";

export const appearanceTheme = () => prefs.appearance.theme;
export const appearanceAccent = () => prefs.appearance.accent;
export const appearanceRailExpanded = () => prefs.appearance.railExpanded;
export const appearanceUiDensity = () => prefs.appearance.uiDensity;
export const appearanceZoom = () => prefs.appearance.zoom;

export function setAppearanceTheme(theme: Theme) {
  setPrefs("appearance", "theme", theme);
  persist();
}

export function setAppearanceAccent(hex: string | null) {
  setPrefs("appearance", "accent", hex);
  persist();
}

export function setAppearanceRailExpanded(expanded: boolean) {
  setPrefs("appearance", "railExpanded", expanded);
  persist();
}

export function setAppearanceUiDensity(density: UiDensity) {
  setPrefs("appearance", "uiDensity", density);
  persist();
}

export function setAppearanceZoom(zoom: number) {
  setPrefs("appearance", "zoom", clampToStops(zoom, ZOOM_STOPS));
  persist();
}

export function stepAppearanceZoom(direction: 1 | -1) {
  setAppearanceZoom(stepStop(appearanceZoom(), ZOOM_STOPS, direction));
}

export function resetAppearanceZoom() {
  setAppearanceZoom(DEFAULT_ZOOM);
}
