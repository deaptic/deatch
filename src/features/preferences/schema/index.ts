import { RECENT_LIMIT } from "../recentChannels.ts";
import { APPEARANCE } from "./appearance.ts";
import { FEED } from "./feed.ts";
import { LINK } from "./link.ts";
import { TRIGGERS } from "./triggers.ts";
import { bool, object, oneOf, text, textList, type Value } from "./fields.ts";
import { CLOCKS } from "../../../shared/time.ts";

export type { BadgePref, EventPref } from "./feed.ts";
export { migrate, PREFERENCES_VERSION } from "./migrations.ts";
export { changesFrom } from "./changes.ts";
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

const SECTIONS = {
  general: object({
    alwaysOnTop: bool(false),
    autostart: bool(false),
    discordRichPresence: bool(false),
    clock: oneOf(CLOCKS, "auto"),
  }),
  feed: FEED,
  notifications: object({ mentionSound: bool(true) }),
  moderation: object({
    autoShoutoutOnRaid: bool(false),
    actionsDisabled: bool(false),
  }),
  advanced: object({ hardwareAcceleration: bool(true) }),
  developer: object({ mode: bool(false), showLogs: bool(false) }),
  appearance: APPEARANCE,
  link: LINK,
  menu: object({ channels: object({ pinned: textList() }) }),
  explore: object({
    language: text(),
    recent: textList({ limit: RECENT_LIMIT }),
  }),
  triggers: TRIGGERS,
};

const PREFERENCES = object(SECTIONS);

export type UserPreferences = Value<typeof PREFERENCES>;
export type PreferencesSection = keyof UserPreferences;

export const PREFERENCES_SECTIONS = Object.keys(
  SECTIONS,
) as PreferencesSection[];

export const DEFAULT_PREFERENCES: UserPreferences = PREFERENCES.fallback();

export const sanitize = (raw: unknown): UserPreferences =>
  PREFERENCES.read(raw);
