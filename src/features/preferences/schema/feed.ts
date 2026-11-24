import { BADGE_CATEGORIES } from "../../../shared/badges.ts";
import { EVENTS } from "../../../shared/moderateActions.ts";
import { DENSITIES } from "../../../shared/density.ts";
import {
  FONT_SIZE_STEPS,
  GROUP_SPACING_STEPS,
} from "../../../shared/accessibility.ts";
import {
  bool,
  object,
  oneOf,
  type ShowPref,
  shown,
  steps,
  text,
  textList,
  type Value,
} from "./fields.ts";

export type EventPref = ShowPref;
export type BadgePref = ShowPref;

export const FEED = object({
  fontSize: steps(FONT_SIZE_STEPS, 16),
  density: oneOf(DENSITIES, "compact"),
  groupSpacing: steps(GROUP_SPACING_STEPS, 8),
  showTimestamp: bool(false),
  showDeletedContent: bool(false),
  showCopypasta: bool(false),
  showAvatars: bool(true),
  groupMessages: bool(true),
  showBadges: bool(true),
  showEvents: bool(true),
  keywords: textList({ nonEmpty: true }),
  events: shown(EVENTS.map((e) => e.key)),
  badges: shown(BADGE_CATEGORIES.map((c) => c.key)),
  users: object({
    showDisplayName: bool(true),
    overrideNameColor: text(),
  }),
});

export type FeedPreferences = Value<typeof FEED>;
