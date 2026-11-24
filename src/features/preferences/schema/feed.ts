import { fromKeys } from "../../../shared/fromKeys.ts";
import {
  BADGE_CATEGORIES,
  type BadgeCategoryKey,
} from "../../../shared/badges.ts";
import { EVENTS, type EventKey } from "../../../shared/moderateActions.ts";
import { DENSITIES, type Density } from "../../../shared/density.ts";
import {
  FONT_SIZE_STEPS,
  GROUP_SPACING_STEPS,
} from "../../../shared/accessibility.ts";
import {
  bool,
  objectOr,
  oneOf,
  type ShowPref,
  showPrefs,
  step,
} from "./read.ts";

export type EventPref = ShowPref;
export type BadgePref = ShowPref;

export const EVENT_KEYS = EVENTS.map((e) => e.key);
export const BADGE_KEYS = BADGE_CATEGORIES.map((c) => c.key);

const FLAGS = [
  "showTimestamp",
  "showDeletedContent",
  "showCopypasta",
  "showAvatars",
  "groupMessages",
  "showBadges",
  "showEvents",
] as const;

export type FeedPreferences = {
  fontSize: number;
  density: Density;
  groupSpacing: number;
  showTimestamp: boolean;
  showDeletedContent: boolean;
  showCopypasta: boolean;
  showAvatars: boolean;
  groupMessages: boolean;
  showBadges: boolean;
  showEvents: boolean;
  keywords: string[];
  events: Record<EventKey, EventPref>;
  badges: Record<BadgeCategoryKey, BadgePref>;
  users: {
    showDisplayName: boolean;
    overrideNameColor: string;
  };
};

function keywords(raw: unknown, fallback: string[]): string[] {
  return Array.isArray(raw)
    ? raw.filter(
        (k): k is string => typeof k === "string" && k.trim().length > 0,
      )
    : fallback;
}

export function readFeed(
  raw: unknown,
  fallback: FeedPreferences,
): FeedPreferences {
  const s = objectOr<FeedPreferences>(raw);
  return {
    fontSize: step(s.fontSize, FONT_SIZE_STEPS, fallback.fontSize),
    density: oneOf(DENSITIES, s.density, fallback.density),
    groupSpacing: step(
      s.groupSpacing,
      GROUP_SPACING_STEPS,
      fallback.groupSpacing,
    ),
    ...fromKeys(FLAGS, (key) => bool(s[key], fallback[key])),
    keywords: keywords(s.keywords, fallback.keywords),
    events: showPrefs(EVENT_KEYS, s.events, fallback.events),
    badges: showPrefs(BADGE_KEYS, s.badges, fallback.badges),
    users: {
      showDisplayName: bool(
        s.users?.showDisplayName,
        fallback.users.showDisplayName,
      ),
      overrideNameColor:
        typeof s.users?.overrideNameColor === "string"
          ? s.users.overrideNameColor
          : fallback.users.overrideNameColor,
    },
  };
}
