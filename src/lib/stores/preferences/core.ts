import { createStore, unwrap } from "solid-js/store";
import type { BadgeCategoryKey, EventKey } from "../../constants.ts";
import { DENSITIES, type Density } from "../../constants/density.ts";
import { type Theme, THEMES } from "../../constants/theme.ts";
import {
  clampToStops,
  FONT_SIZE_STOPS,
  GROUP_SPACING_STOPS,
  UI_DENSITIES,
  type UiDensity,
  ZOOM_STOPS,
} from "../../constants/accessibility.ts";
import defaults from "../default-preferences.json" with { type: "json" };

export type EventPref = { show: boolean };
export type BadgePref = { show: boolean };

export const MIN_TRIGGER_COOLDOWN = 5;
export const MAX_TRIGGER_COOLDOWN = 600;

export function clampCooldown(value: number): number {
  if (!Number.isFinite(value)) return MIN_TRIGGER_COOLDOWN;
  return Math.min(
    MAX_TRIGGER_COOLDOWN,
    Math.max(MIN_TRIGGER_COOLDOWN, Math.floor(value)),
  );
}

export type TriggerLocation = "start" | "exact" | "anywhere";
export type TriggerAction = "send" | "reply";
export type Trigger = {
  id: string;
  enabled: boolean;
  name: string;
  phrase: string;
  location: TriggerLocation;
  caseSensitive: boolean;
  cooldown: number;
  action: TriggerAction;
  response: string;
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
    keywords: string[];
    events: Partial<Record<EventKey, EventPref>>;
    badges: Partial<Record<BadgeCategoryKey, BadgePref>>;
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
  };
  appearance: {
    theme: Theme;
    accent: string | null;
    railExpanded: boolean;
    uiDensity: UiDensity;
    zoom: number;
  };
  menu: {
    channels: {
      pinned: string[];
    };
  };
  explore: {
    language: string;
  };
  triggers: Trigger[];
};

const DEFAULT_PREFERENCES = defaults as UserPreferences;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function sanitizeHex(raw: unknown): string | null {
  return typeof raw === "string" && HEX_COLOR.test(raw.trim())
    ? raw.trim().toLowerCase()
    : null;
}

function sanitizeTheme(raw: unknown): Theme {
  return THEMES.includes(raw as Theme)
    ? (raw as Theme)
    : DEFAULT_PREFERENCES.appearance.theme;
}

function sanitizeStop(
  raw: unknown,
  stops: readonly number[],
  fallback: number,
): number {
  return typeof raw === "number" && Number.isFinite(raw)
    ? clampToStops(raw, stops)
    : fallback;
}

function sanitizeUiDensity(raw: unknown): UiDensity {
  return UI_DENSITIES.includes(raw as UiDensity)
    ? (raw as UiDensity)
    : DEFAULT_PREFERENCES.appearance.uiDensity;
}

function sanitizeDensity(raw: unknown): Density {
  return DENSITIES.includes(raw as Density)
    ? (raw as Density)
    : DEFAULT_PREFERENCES.feed.density;
}

// A hand-edited "false" string is truthy; only real booleans count.
function bool(raw: unknown, fallback: boolean): boolean {
  return typeof raw === "boolean" ? raw : fallback;
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
      location: t.location === "start" || t.location === "exact"
        ? t.location
        : "anywhere",
      caseSensitive: t.caseSensitive === true,
      cooldown: typeof t.cooldown === "number"
        ? clampCooldown(t.cooldown)
        : MIN_TRIGGER_COOLDOWN,
      action: t.action === "send" ? "send" : "reply",
      response: typeof t.response === "string" ? t.response : "",
    });
  }
  return out;
}

function load(): UserPreferences {
  try {
    const raw = localStorage.getItem("user_preferences");
    const stored = raw ? (JSON.parse(raw) as Partial<UserPreferences>) : {};
    const rawPinned = stored.menu?.channels?.pinned;
    const pinned = Array.isArray(rawPinned)
      ? rawPinned.filter((s): s is string => typeof s === "string")
      : DEFAULT_PREFERENCES.menu.channels.pinned;
    return {
      feed: {
        fontSize: sanitizeStop(
          stored.feed?.fontSize,
          FONT_SIZE_STOPS,
          DEFAULT_PREFERENCES.feed.fontSize,
        ),
        density: sanitizeDensity(stored.feed?.density),
        groupSpacing: sanitizeStop(
          stored.feed?.groupSpacing,
          GROUP_SPACING_STOPS,
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
        keywords: Array.isArray(stored.feed?.keywords)
          ? stored.feed!.keywords.filter((k): k is string =>
            typeof k === "string" && k.trim().length > 0
          )
          : DEFAULT_PREFERENCES.feed.keywords,
        events: { ...DEFAULT_PREFERENCES.feed.events, ...stored.feed?.events },
        badges: { ...DEFAULT_PREFERENCES.feed.badges, ...stored.feed?.badges },
        users: {
          showDisplayName: bool(
            stored.feed?.users?.showDisplayName,
            DEFAULT_PREFERENCES.feed.users.showDisplayName,
          ),
          overrideNameColor: typeof stored.feed?.users?.overrideNameColor ===
              "string"
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
      },
      appearance: {
        theme: sanitizeTheme(stored.appearance?.theme),
        accent: sanitizeHex(stored.appearance?.accent),
        railExpanded: bool(
          stored.appearance?.railExpanded,
          DEFAULT_PREFERENCES.appearance.railExpanded,
        ),
        uiDensity: sanitizeUiDensity(stored.appearance?.uiDensity),
        zoom: sanitizeStop(
          stored.appearance?.zoom,
          ZOOM_STOPS,
          DEFAULT_PREFERENCES.appearance.zoom,
        ),
      },
      menu: {
        channels: { pinned },
      },
      explore: {
        language: typeof stored.explore?.language === "string"
          ? stored.explore.language
          : DEFAULT_PREFERENCES.explore.language,
      },
      triggers: sanitizeTriggers(stored.triggers),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export const [prefs, setPrefs] = createStore<UserPreferences>(load());

export function persist() {
  localStorage.setItem("user_preferences", JSON.stringify(unwrap(prefs)));
}
