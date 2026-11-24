import { THEMES } from "../../../shared/theme.ts";
import { UI_DENSITIES, ZOOM_STEPS } from "../../../shared/accessibility.ts";
import { ACTIVITIES } from "../../../shared/activities.ts";
import {
  bool,
  flags,
  hexColor,
  object,
  oneOf,
  steps,
  type Value,
} from "./fields.ts";

export const APPEARANCE = object({
  theme: oneOf(THEMES, "system"),
  accent: hexColor(),
  railExpanded: bool(false),
  followedPrompt: bool(true),
  activities: flags(ACTIVITIES, () => true),
  uiDensity: oneOf(UI_DENSITIES, "default"),
  zoom: steps(ZOOM_STEPS, 100),
});

export type AppearancePreferences = Value<typeof APPEARANCE>;
