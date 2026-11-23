import type { UiDensity } from "../../shared/accessibility.ts";
import type { Theme } from "../../lib/constants/theme.ts";
import type { Density } from "../../lib/constants/density.ts";
import { t } from "../../shared/i18n/index.ts";

export const themeOptions = (): { value: Theme; label: string }[] => [
  { value: "system", label: t("SETTINGS_APPEARANCE_THEME_SYSTEM_LABEL") },
  { value: "dark", label: t("SETTINGS_APPEARANCE_THEME_DARK_LABEL") },
  { value: "light", label: t("SETTINGS_APPEARANCE_THEME_LIGHT_LABEL") },
];

export const uiDensityOptions = (): { value: UiDensity; label: string }[] => [
  { value: "compact", label: t("SETTINGS_APPEARANCE_COMPACT_LABEL") },
  { value: "default", label: t("SETTINGS_APPEARANCE_DEFAULT_LABEL") },
  { value: "spacious", label: t("SETTINGS_APPEARANCE_SPACIOUS_LABEL") },
];

export const messageLayoutOptions = (): { value: Density; label: string }[] => [
  { value: "compact", label: t("SETTINGS_APPEARANCE_COMPACT_LABEL") },
  { value: "comfortable", label: t("SETTINGS_APPEARANCE_SPACIOUS_LABEL") },
];
