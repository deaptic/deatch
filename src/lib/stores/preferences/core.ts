import { createStore, unwrap } from "solid-js/store";
import type { BadgeCategoryKey, EventKey } from "../../constants.ts";
import { type Theme, THEMES } from "../../services/appearance.ts";
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
    showTimestamp: boolean;
    showDeletedContent: boolean;
    showCopypasta: boolean;
    keywords: string[];
    events: Partial<Record<EventKey, EventPref>>;
    badges: Partial<Record<BadgeCategoryKey, BadgePref>>;
    users: {
      muted: string[];
      showDisplayName: boolean;
      overrideNameColor: string;
      nicknames: Record<string, string>;
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
  };
  menu: {
    channels: {
      pinned: string[];
    };
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

function sanitizeNicknames(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (
    const [login, nickname] of Object.entries(raw as Record<string, unknown>)
  ) {
    if (typeof nickname !== "string") continue;
    const trimmedLogin = login.trim().toLowerCase();
    const trimmedNick = nickname.trim();
    if (!trimmedLogin || !trimmedNick) continue;
    out[trimmedLogin] = trimmedNick;
  }
  return out;
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
        fontSize: stored.feed?.fontSize ?? DEFAULT_PREFERENCES.feed.fontSize,
        showTimestamp: stored.feed?.showTimestamp ??
          DEFAULT_PREFERENCES.feed.showTimestamp,
        showDeletedContent: stored.feed?.showDeletedContent ??
          DEFAULT_PREFERENCES.feed.showDeletedContent,
        showCopypasta: stored.feed?.showCopypasta ??
          DEFAULT_PREFERENCES.feed.showCopypasta,
        keywords: Array.isArray(stored.feed?.keywords)
          ? stored.feed!.keywords.filter((k): k is string =>
            typeof k === "string" && k.trim().length > 0
          )
          : DEFAULT_PREFERENCES.feed.keywords,
        events: { ...DEFAULT_PREFERENCES.feed.events, ...stored.feed?.events },
        badges: { ...DEFAULT_PREFERENCES.feed.badges, ...stored.feed?.badges },
        users: {
          muted:
            (stored.feed?.users?.muted ?? DEFAULT_PREFERENCES.feed.users.muted)
              .filter((s) => /^\d+$/.test(s)),
          showDisplayName: stored.feed?.users?.showDisplayName ??
            DEFAULT_PREFERENCES.feed.users.showDisplayName,
          overrideNameColor: stored.feed?.users?.overrideNameColor ??
            DEFAULT_PREFERENCES.feed.users.overrideNameColor,
          nicknames: sanitizeNicknames(stored.feed?.users?.nicknames),
        },
      },
      notifications: {
        mentionSound: stored.notifications?.mentionSound ??
          DEFAULT_PREFERENCES.notifications.mentionSound,
      },
      moderation: {
        autoShoutoutOnRaid: stored.moderation?.autoShoutoutOnRaid ??
          DEFAULT_PREFERENCES.moderation.autoShoutoutOnRaid,
        actionsDisabled: stored.moderation?.actionsDisabled ??
          DEFAULT_PREFERENCES.moderation.actionsDisabled,
      },
      advanced: {
        developerMode: stored.advanced?.developerMode ??
          DEFAULT_PREFERENCES.advanced.developerMode,
        showLogs: stored.advanced?.showLogs ??
          DEFAULT_PREFERENCES.advanced.showLogs,
        alwaysOnTop: stored.advanced?.alwaysOnTop ??
          DEFAULT_PREFERENCES.advanced.alwaysOnTop,
        autostart: stored.advanced?.autostart ??
          DEFAULT_PREFERENCES.advanced.autostart,
        discordRichPresence: stored.advanced?.discordRichPresence ??
          DEFAULT_PREFERENCES.advanced.discordRichPresence,
      },
      appearance: {
        theme: sanitizeTheme(stored.appearance?.theme),
        accent: sanitizeHex(stored.appearance?.accent),
        railExpanded: stored.appearance?.railExpanded ??
          DEFAULT_PREFERENCES.appearance.railExpanded,
      },
      menu: {
        channels: { pinned },
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
