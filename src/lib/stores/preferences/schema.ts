import { RECENT_LIMIT } from "../../utils/recentChannels.ts";
import type { Anchor } from "../../../shared/wordMatch.ts";
import {
  BADGE_CATEGORIES,
  type BadgeCategoryKey,
} from "../../constants/badges.ts";
import { EVENTS, type EventKey } from "../../constants/events.ts";
import { DENSITIES, type Density } from "../../constants/density.ts";
import { type Theme, THEMES } from "../../constants/theme.ts";
import {
  type Language,
  LANGUAGES,
  systemLanguage,
} from "../../../shared/i18n/index.ts";
import {
  clampToStops,
  FONT_SIZE_STEPS,
  GROUP_SPACING_STEPS,
  type Steps,
  UI_DENSITIES,
  type UiDensity,
  ZOOM_STEPS,
} from "../../../shared/accessibility.ts";
import {
  clampControl,
  COMPRESSOR_CONTROLS,
  type CompressorSettings,
  DEFAULT_COMPRESSOR,
  MAX_CHANNEL_GAIN,
} from "../../constants/audio.ts";
import { fromKeys } from "../../utils/fromKeys.ts";
import { ACTIVITIES, type ActivityKind } from "../../constants/activities.ts";
import { DEFAULTS as defaults } from "./defaults.ts";

type ShowPref = { show: boolean };
export type EventPref = ShowPref;
export type BadgePref = ShowPref;

export const MIN_TRIGGER_COOLDOWN = 5;
export const MAX_TRIGGER_COOLDOWN = 600;

export function clampCooldown(value: number): number {
  if (!Number.isFinite(value)) return MIN_TRIGGER_COOLDOWN;
  return Math.min(
    MAX_TRIGGER_COOLDOWN,
    Math.max(MIN_TRIGGER_COOLDOWN, Math.floor(value)),
  );
}

export type TriggerAction = "send" | "reply";
export const TRIGGER_ROLES = [
  "everyone",
  "subscriber",
  "vip",
  "moderator",
  "broadcaster",
] as const;
export type TriggerRole = (typeof TRIGGER_ROLES)[number];
export const CONDITION_OPS = [
  "set",
  "empty",
  "is",
  "isNot",
  "contains",
  "notContains",
  "above",
  "below",
] as const;
export type ConditionOp = (typeof CONDITION_OPS)[number];
export type Condition = { left: string; op: ConditionOp; right: string };
export type ConditionalReply = { when: Condition[][]; text: string };
export const BUILT_IN_TRIGGERS = [
  "accountage",
  "followage",
  "game",
  "title",
  "uptime",
] as const;
export type BuiltInTrigger = (typeof BUILT_IN_TRIGGERS)[number];
export type Trigger = {
  id: string;
  enabled: boolean;
  name: string;
  phrase: string;
  location: Anchor;
  caseSensitive: boolean;
  cooldown: number;
  action: TriggerAction;
  replies: ConditionalReply[];
  otherwise: string;
  role: TriggerRole;
  count: number;
};

export type UserPreferences = {
  feed: {
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
  notifications: {
    mentionSound: boolean;
  };
  moderation: {
    autoShoutoutOnRaid: boolean;
    actionsDisabled: boolean;
  };
  advanced: {
    developerMode: boolean;
    showLogs: boolean;
    alwaysOnTop: boolean;
    autostart: boolean;
    discordRichPresence: boolean;
    hardwareAcceleration: boolean;
  };
  appearance: {
    language: Language;
    theme: Theme;
    accent: string | null;
    railExpanded: boolean;
    activities: Record<ActivityKind, boolean>;
    uiDensity: UiDensity;
    zoom: number;
  };
  link: {
    audioLink: boolean;
    compressor: boolean;
    compressorSettings: CompressorSettings;
    channelGains: Record<string, number>;
  };
  menu: {
    channels: {
      pinned: string[];
    };
  };
  explore: {
    language: string;
    recent: string[];
  };
  triggers: {
    builtIn: Record<BuiltInTrigger, boolean>;
    custom: Trigger[];
  };
};

const EVENT_KEYS = EVENTS.map((e) => e.key);
const BADGE_KEYS = BADGE_CATEGORIES.map((c) => c.key);

function showPrefs<K extends string>(
  keys: readonly K[],
  raw: unknown,
  fallback: Partial<Record<K, ShowPref>> = {},
): Record<K, ShowPref> {
  const stored: Partial<Record<string, unknown>> =
    raw && typeof raw === "object" ? raw : {};
  return fromKeys(keys, (key) => {
    const value = stored[key];
    const show =
      value && typeof value === "object" && "show" in value
        ? value.show
        : undefined;
    return typeof show === "boolean"
      ? { show }
      : (fallback[key] ?? { show: true });
  });
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  ...defaults,
  feed: {
    ...defaults.feed,
    events: showPrefs(EVENT_KEYS, defaults.feed.events),
    badges: showPrefs(BADGE_KEYS, defaults.feed.badges),
  },
  link: { ...defaults.link, compressorSettings: DEFAULT_COMPRESSOR },
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function sanitizeKeywords(raw: unknown): string[] {
  return Array.isArray(raw)
    ? raw.filter(
        (k): k is string => typeof k === "string" && k.trim().length > 0,
      )
    : DEFAULT_PREFERENCES.feed.keywords;
}

function sanitizeHex(raw: unknown): string | null {
  return typeof raw === "string" && HEX_COLOR.test(raw.trim())
    ? raw.trim().toLowerCase()
    : null;
}

function oneOf<T extends string>(
  values: readonly T[],
  raw: unknown,
  fallback: T,
): T {
  return values.find((v) => v === raw) ?? fallback;
}

function sanitizeTheme(raw: unknown): Theme {
  return oneOf(THEMES, raw, DEFAULT_PREFERENCES.appearance.theme);
}

function sanitizeStop(raw: unknown, stops: Steps, fallback: number): number {
  return typeof raw === "number" && Number.isFinite(raw)
    ? clampToStops(raw, stops)
    : fallback;
}

function sanitizeUiDensity(raw: unknown): UiDensity {
  return oneOf(UI_DENSITIES, raw, DEFAULT_PREFERENCES.appearance.uiDensity);
}

function sanitizeDensity(raw: unknown): Density {
  return oneOf(DENSITIES, raw, DEFAULT_PREFERENCES.feed.density);
}

function bool(raw: unknown, fallback: boolean): boolean {
  return typeof raw === "boolean" ? raw : fallback;
}

const text = (raw: unknown) => (typeof raw === "string" ? raw : "");

function sanitizeConditions(raw: unknown): Condition[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item: unknown) => {
    if (!item || typeof item !== "object") return [];
    const condition = item as Partial<Condition>;
    return [
      {
        left: text(condition.left),
        op: CONDITION_OPS.find((op) => op === condition.op) ?? "set",
        right: text(condition.right),
      },
    ];
  });
}

function sanitizeReplies(raw: unknown): ConditionalReply[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item: unknown) => {
    if (!item || typeof item !== "object") return [];
    const reply = item as Partial<ConditionalReply>;
    const when = Array.isArray(reply.when)
      ? reply.when.map(sanitizeConditions).filter((g) => g.length > 0)
      : [];
    return when.length ? [{ when, text: text(reply.text) }] : [];
  });
}

function sanitizeTriggers(raw: unknown): Trigger[] {
  if (!Array.isArray(raw)) return [];
  const out: Trigger[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const t = item as Partial<Trigger>;
    if (typeof t.id !== "string" || typeof t.phrase !== "string") continue;
    out.push({
      id: t.id,
      enabled: t.enabled !== false,
      name: typeof t.name === "string" ? t.name : "",
      phrase: t.phrase,
      location:
        t.location === "start" || t.location === "exact"
          ? t.location
          : "anywhere",
      caseSensitive: t.caseSensitive === true,
      cooldown:
        typeof t.cooldown === "number"
          ? clampCooldown(t.cooldown)
          : MIN_TRIGGER_COOLDOWN,
      action: t.action === "send" ? "send" : "reply",
      replies: sanitizeReplies(t.replies),
      otherwise: typeof t.otherwise === "string" ? t.otherwise : "",
      role: TRIGGER_ROLES.find((r) => r === t.role) ?? "everyone",
      count:
        typeof t.count === "number" && Number.isFinite(t.count)
          ? Math.max(0, Math.floor(t.count))
          : 0,
    });
  }
  return out;
}

function sanitizeCompressor(raw: unknown): CompressorSettings {
  const stored = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const out = { ...DEFAULT_COMPRESSOR };
  for (const control of COMPRESSOR_CONTROLS) {
    const value = stored[control];
    if (typeof value === "number" && Number.isFinite(value)) {
      out[control] = clampControl(control, value);
    }
  }
  return out;
}

function sanitizeChannelGains(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [login, gain] of Object.entries(raw)) {
    if (typeof gain === "number" && Number.isFinite(gain)) {
      out[login] = Math.round(Math.min(MAX_CHANNEL_GAIN, Math.max(0, gain)));
    }
  }
  return out;
}

function strings(raw: unknown, fallback: string[]): string[] {
  return Array.isArray(raw)
    ? raw.filter((s): s is string => typeof s === "string")
    : fallback;
}

type Stored<T> = T extends object ? { [K in keyof T]?: Stored<T[K]> } : T;

export function sanitize(raw: unknown): UserPreferences {
  const stored = (
    raw && typeof raw === "object" ? raw : {}
  ) as Stored<UserPreferences>;
  return structuredClone<UserPreferences>({
    feed: {
      fontSize: sanitizeStop(
        stored.feed?.fontSize,
        FONT_SIZE_STEPS,
        DEFAULT_PREFERENCES.feed.fontSize,
      ),
      density: sanitizeDensity(stored.feed?.density),
      groupSpacing: sanitizeStop(
        stored.feed?.groupSpacing,
        GROUP_SPACING_STEPS,
        DEFAULT_PREFERENCES.feed.groupSpacing,
      ),
      showTimestamp: bool(
        stored.feed?.showTimestamp,
        DEFAULT_PREFERENCES.feed.showTimestamp,
      ),
      showDeletedContent: bool(
        stored.feed?.showDeletedContent,
        DEFAULT_PREFERENCES.feed.showDeletedContent,
      ),
      showCopypasta: bool(
        stored.feed?.showCopypasta,
        DEFAULT_PREFERENCES.feed.showCopypasta,
      ),
      showAvatars: bool(
        stored.feed?.showAvatars,
        DEFAULT_PREFERENCES.feed.showAvatars,
      ),
      groupMessages: bool(
        stored.feed?.groupMessages,
        DEFAULT_PREFERENCES.feed.groupMessages,
      ),
      showBadges: bool(
        stored.feed?.showBadges,
        DEFAULT_PREFERENCES.feed.showBadges,
      ),
      showEvents: bool(
        stored.feed?.showEvents,
        DEFAULT_PREFERENCES.feed.showEvents,
      ),
      keywords: sanitizeKeywords(stored.feed?.keywords),
      events: showPrefs(
        EVENT_KEYS,
        stored.feed?.events,
        DEFAULT_PREFERENCES.feed.events,
      ),
      badges: showPrefs(
        BADGE_KEYS,
        stored.feed?.badges,
        DEFAULT_PREFERENCES.feed.badges,
      ),
      users: {
        showDisplayName: bool(
          stored.feed?.users?.showDisplayName,
          DEFAULT_PREFERENCES.feed.users.showDisplayName,
        ),
        overrideNameColor:
          typeof stored.feed?.users?.overrideNameColor === "string"
            ? stored.feed.users.overrideNameColor
            : DEFAULT_PREFERENCES.feed.users.overrideNameColor,
      },
    },
    notifications: {
      mentionSound: bool(
        stored.notifications?.mentionSound,
        DEFAULT_PREFERENCES.notifications.mentionSound,
      ),
    },
    moderation: {
      autoShoutoutOnRaid: bool(
        stored.moderation?.autoShoutoutOnRaid,
        DEFAULT_PREFERENCES.moderation.autoShoutoutOnRaid,
      ),
      actionsDisabled: bool(
        stored.moderation?.actionsDisabled,
        DEFAULT_PREFERENCES.moderation.actionsDisabled,
      ),
    },
    advanced: {
      developerMode: bool(
        stored.advanced?.developerMode,
        DEFAULT_PREFERENCES.advanced.developerMode,
      ),
      showLogs: bool(
        stored.advanced?.showLogs,
        DEFAULT_PREFERENCES.advanced.showLogs,
      ),
      alwaysOnTop: bool(
        stored.advanced?.alwaysOnTop,
        DEFAULT_PREFERENCES.advanced.alwaysOnTop,
      ),
      autostart: bool(
        stored.advanced?.autostart,
        DEFAULT_PREFERENCES.advanced.autostart,
      ),
      discordRichPresence: bool(
        stored.advanced?.discordRichPresence,
        DEFAULT_PREFERENCES.advanced.discordRichPresence,
      ),
      hardwareAcceleration: bool(
        stored.advanced?.hardwareAcceleration,
        DEFAULT_PREFERENCES.advanced.hardwareAcceleration,
      ),
    },
    appearance: {
      language: oneOf(LANGUAGES, stored.appearance?.language, systemLanguage()),
      theme: sanitizeTheme(stored.appearance?.theme),
      accent: sanitizeHex(stored.appearance?.accent),
      railExpanded: bool(
        stored.appearance?.railExpanded,
        DEFAULT_PREFERENCES.appearance.railExpanded,
      ),
      activities: fromKeys(ACTIVITIES, (key) =>
        bool(
          stored.appearance?.activities?.[key],
          DEFAULT_PREFERENCES.appearance.activities[key],
        ),
      ),
      uiDensity: sanitizeUiDensity(stored.appearance?.uiDensity),
      zoom: sanitizeStop(
        stored.appearance?.zoom,
        ZOOM_STEPS,
        DEFAULT_PREFERENCES.appearance.zoom,
      ),
    },
    link: {
      audioLink: bool(
        stored.link?.audioLink,
        DEFAULT_PREFERENCES.link.audioLink,
      ),
      compressor: bool(
        stored.link?.compressor,
        DEFAULT_PREFERENCES.link.compressor,
      ),
      compressorSettings: sanitizeCompressor(stored.link?.compressorSettings),
      channelGains: sanitizeChannelGains(stored.link?.channelGains),
    },
    menu: {
      channels: {
        pinned: strings(
          stored.menu?.channels?.pinned,
          DEFAULT_PREFERENCES.menu.channels.pinned,
        ),
      },
    },
    explore: {
      language:
        typeof stored.explore?.language === "string"
          ? stored.explore.language
          : DEFAULT_PREFERENCES.explore.language,
      recent: strings(
        stored.explore?.recent,
        DEFAULT_PREFERENCES.explore.recent,
      ).slice(0, RECENT_LIMIT),
    },
    triggers: {
      builtIn: fromKeys(BUILT_IN_TRIGGERS, (key) =>
        bool(
          stored.triggers?.builtIn?.[key],
          DEFAULT_PREFERENCES.triggers.builtIn[key],
        ),
      ),
      custom: sanitizeTriggers(stored.triggers?.custom),
    },
  });
}
