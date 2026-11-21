import type { UiDensity } from "../../../lib/constants/accessibility.ts";
import type { Theme } from "../../../lib/constants/theme.ts";
import { t } from "../../../lib/i18n/index.ts";

export const themeOptions = (): { value: Theme; label: string }[] => [
  { value: "system", label: t("SETTINGS_APPEARANCE_THEME_SYSTEM") },
  { value: "dark", label: t("SETTINGS_APPEARANCE_THEME_DARK") },
  { value: "light", label: t("SETTINGS_APPEARANCE_THEME_LIGHT") },
];

export const uiDensityOptions = (): { value: UiDensity; label: string }[] => [
  { value: "compact", label: t("SETTINGS_APPEARANCE_COMPACT") },
  { value: "default", label: t("SETTINGS_APPEARANCE_DEFAULT") },
  { value: "spacious", label: t("SETTINGS_APPEARANCE_SPACIOUS") },
];
