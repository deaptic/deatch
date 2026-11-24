import { type Theme, THEMES } from "../../../shared/theme.ts";
import {
  type Language,
  LANGUAGES,
  systemLanguage,
} from "../../../shared/i18n/index.ts";
import {
  UI_DENSITIES,
  type UiDensity,
  ZOOM_STEPS,
} from "../../../shared/accessibility.ts";
import { ACTIVITIES, type ActivityKind } from "../../../shared/activities.ts";
import { fromKeys } from "../../../shared/fromKeys.ts";
import { bool, objectOr, oneOf, step } from "./read.ts";

export type AppearancePreferences = {
  language: Language;
  theme: Theme;
  accent: string | null;
  railExpanded: boolean;
  activities: Record<ActivityKind, boolean>;
  uiDensity: UiDensity;
  zoom: number;
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function hex(raw: unknown): string | null {
  return typeof raw === "string" && HEX_COLOR.test(raw.trim())
    ? raw.trim().toLowerCase()
    : null;
}

export function readAppearance(
  raw: unknown,
  fallback: AppearancePreferences,
): AppearancePreferences {
  const s = objectOr<AppearancePreferences>(raw);
  return {
    language: oneOf(LANGUAGES, s.language, systemLanguage()),
    theme: oneOf(THEMES, s.theme, fallback.theme),
    accent: hex(s.accent),
    railExpanded: bool(s.railExpanded, fallback.railExpanded),
    activities: fromKeys(ACTIVITIES, (key) =>
      bool(s.activities?.[key], fallback.activities[key]),
    ),
    uiDensity: oneOf(UI_DENSITIES, s.uiDensity, fallback.uiDensity),
    zoom: step(s.zoom, ZOOM_STEPS, fallback.zoom),
  };
}
