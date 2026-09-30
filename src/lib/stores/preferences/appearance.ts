import type { Theme } from "../../constants/theme.ts";
import { persist, prefs, setPrefs } from "./core.ts";

export const appearanceTheme = () => prefs.appearance.theme;
export const appearanceAccent = () => prefs.appearance.accent;
export const appearanceRailExpanded = () => prefs.appearance.railExpanded;

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
