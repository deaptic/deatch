import { RECENT_LIMIT } from "../recentChannels.ts";
import { DEFAULT_COMPRESSOR } from "../../../shared/audio.ts";
import { DEFAULTS as defaults } from "./defaults.ts";
import { type AppearancePreferences, readAppearance } from "./appearance.ts";
import {
  BADGE_KEYS,
  EVENT_KEYS,
  type FeedPreferences,
  readFeed,
} from "./feed.ts";
import { type LinkPreferences, readLink } from "./link.ts";
import { readTriggers, type TriggerPreferences } from "./triggers.ts";
import { bools, objectOr, showPrefs, strings } from "./read.ts";

export type { BadgePref, EventPref } from "./feed.ts";
export {
  BUILT_IN_TRIGGERS,
  type BuiltInTrigger,
  clampCooldown,
  type Condition,
  type ConditionalReply,
  type ConditionOp,
  CONDITION_OPS,
  MAX_TRIGGER_COOLDOWN,
  MIN_TRIGGER_COOLDOWN,
  type Trigger,
  type TriggerAction,
  type TriggerRole,
  TRIGGER_ROLES,
} from "./triggers.ts";

export type UserPreferences = {
  feed: FeedPreferences;
  notifications: { mentionSound: boolean };
  moderation: { autoShoutoutOnRaid: boolean; actionsDisabled: boolean };
  advanced: {
    developerMode: boolean;
    showLogs: boolean;
    alwaysOnTop: boolean;
    autostart: boolean;
    discordRichPresence: boolean;
    hardwareAcceleration: boolean;
  };
  appearance: AppearancePreferences;
  link: LinkPreferences;
  menu: { channels: { pinned: string[] } };
  explore: { language: string; recent: string[] };
  triggers: TriggerPreferences;
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  ...defaults,
  feed: {
    ...defaults.feed,
    events: showPrefs(EVENT_KEYS, defaults.feed.events),
    badges: showPrefs(BADGE_KEYS, defaults.feed.badges),
  },
  link: { ...defaults.link, compressorSettings: DEFAULT_COMPRESSOR },
};

export function sanitize(raw: unknown): UserPreferences {
  const stored = objectOr<UserPreferences>(raw);
  const fallback = DEFAULT_PREFERENCES;
  return structuredClone<UserPreferences>({
    feed: readFeed(stored.feed, fallback.feed),
    notifications: bools(stored.notifications, fallback.notifications),
    moderation: bools(stored.moderation, fallback.moderation),
    advanced: bools(stored.advanced, fallback.advanced),
    appearance: readAppearance(stored.appearance, fallback.appearance),
    link: readLink(stored.link, fallback.link),
    menu: {
      channels: {
        pinned: strings(
          stored.menu?.channels?.pinned,
          fallback.menu.channels.pinned,
        ),
      },
    },
    explore: {
      language:
        typeof stored.explore?.language === "string"
          ? stored.explore.language
          : fallback.explore.language,
      recent: strings(stored.explore?.recent, fallback.explore.recent).slice(
        0,
        RECENT_LIMIT,
      ),
    },
    triggers: readTriggers(stored.triggers, fallback.triggers),
  });
}
