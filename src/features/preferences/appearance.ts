import type { ActivityKind } from "../../lib/constants/activities.ts";
import type { Theme } from "../../lib/constants/theme.ts";
import {
  clampToStops,
  DEFAULT_ZOOM,
  stepStop,
  type UiDensity,
  ZOOM_STEPS,
} from "../../shared/accessibility.ts";
import { prefs, setPrefs } from "./core.ts";
import type { Language } from "../../shared/i18n/index.ts";

export const appearanceTheme = () => prefs.appearance.theme;
export const appearanceLanguage = () => prefs.appearance.language;

export function setAppearanceLanguage(language: Language) {
  setPrefs("appearance", "language", language);
}
export const appearanceAccent = () => prefs.appearance.accent;
export const appearanceRailExpanded = () => prefs.appearance.railExpanded;
export const activityShown = (kind: ActivityKind) =>
  prefs.appearance.activities[kind];
export const appearanceUiDensity = () => prefs.appearance.uiDensity;
export const appearanceZoom = () => prefs.appearance.zoom;

export function setAppearanceTheme(theme: Theme) {
  setPrefs("appearance", "theme", theme);
}

export function setAppearanceAccent(hex: string | null) {
  setPrefs("appearance", "accent", hex);
}

export function setAppearanceRailExpanded(expanded: boolean) {
  setPrefs("appearance", "railExpanded", expanded);
}

export function setActivityShown(kind: ActivityKind, shown: boolean) {
  setPrefs("appearance", "activities", kind, shown);
}

export function setAppearanceUiDensity(density: UiDensity) {
  setPrefs("appearance", "uiDensity", density);
}

export function setAppearanceZoom(zoom: number) {
  setPrefs("appearance", "zoom", clampToStops(zoom, ZOOM_STEPS));
}

export function stepAppearanceZoom(direction: 1 | -1) {
  setAppearanceZoom(stepStop(appearanceZoom(), ZOOM_STEPS, direction));
}

export function resetAppearanceZoom() {
  setAppearanceZoom(DEFAULT_ZOOM);
}
