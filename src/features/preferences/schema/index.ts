import { RECENT_LIMIT } from "../recentChannels.ts";
import { APPEARANCE } from "./appearance.ts";
import { FEED } from "./feed.ts";
import { LINK } from "./link.ts";
import { TRIGGERS } from "./triggers.ts";
import { TIMERS } from "./timers.ts";
import { WIDGETS } from "./widgets.ts";
import { bool, object, oneOf, text, textList, type Value } from "./fields.ts";
import { CLOCKS } from "../../../shared/time.ts";
import { LANGUAGES, systemLanguage } from "../../../shared/i18n/index.ts";

export type { BadgePref, EventPref } from "./feed.ts";

export const QUICK_TIMEOUTS = ["1m", "10m", "1h", "1d"] as const;
export type QuickTimeout = (typeof QUICK_TIMEOUTS)[number];
export { TIMER_ACTIVITY, TIMER_MINUTES, type Timer } from "./timers.ts";
export {
  type ChatStyle,
  type ChatWidget,
  newChatStyle,
  type Widget,
  WIDGET_FADE_SECONDS,
  WIDGET_ALIGNS,
  WIDGET_LINES,
  WIDGET_SIDES,
  WIDGET_RANGES,
  WIDGET_WIDTHS,
} from "./widgets.ts";
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
  notifications: object({
    keywords: textList({ nonEmpty: true }),
    mentionSound: bool(true),
    whisperSound: bool(true),
    streamerMode: bool(false),
    streamerAuto: bool(true),
  }),
  appearance: APPEARANCE,
  feed: FEED,
  language: object({
    app: oneOf(LANGUAGES, systemLanguage),
    clock: oneOf(CLOCKS, "auto"),
  }),
  system: object({
    autostart: bool(true),
    alwaysOnTop: bool(false),
    discordRichPresence: bool(false),
    hardwareAcceleration: bool(true),
    followedChannels: bool(false),
  }),
  moderation: object({
    autoShoutoutOnRaid: bool(false),
    moderatorTools: bool(true),
    keyboard: bool(false),
    quickTimeout: oneOf(QUICK_TIMEOUTS, "10m"),
    reasons: textList({ nonEmpty: true }),
  }),
  developer: object({ mode: bool(false), showLogs: bool(false) }),
  link: LINK,
  menu: object({ channels: object({ pinned: textList() }) }),
  explore: object({
    language: text(),
    recent: textList({ limit: RECENT_LIMIT }),
  }),
  triggers: TRIGGERS,
  timers: TIMERS,
  widgets: WIDGETS,
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
