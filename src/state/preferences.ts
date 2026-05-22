import { createStore, produce, unwrap } from "solid-js/store";
import type { EventKey, BadgeCategoryKey } from "../constants";
import defaults from "./default-preferences.json";
import { addToast } from "./toasts";

export type EventPref = { show: boolean };
export type BadgePref = { show: boolean };

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
    colors: Record<string, string>;
  };
  menu: {
    channels: {
      pinned: string[];
    };
  };
};

const DEFAULT_PREFERENCES = defaults as UserPreferences;

function sanitizeAppearanceColors(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    out[key] = trimmed;
  }
  return out;
}

function sanitizeNicknames(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [login, nickname] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof nickname !== "string") continue;
    const trimmedLogin = login.trim().toLowerCase();
    const trimmedNick = nickname.trim();
    if (!trimmedLogin || !trimmedNick) continue;
    out[trimmedLogin] = trimmedNick;
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
        showTimestamp: stored.feed?.showTimestamp ?? DEFAULT_PREFERENCES.feed.showTimestamp,
        showDeletedContent: stored.feed?.showDeletedContent ?? DEFAULT_PREFERENCES.feed.showDeletedContent,
        showCopypasta: stored.feed?.showCopypasta ?? DEFAULT_PREFERENCES.feed.showCopypasta,
        keywords: Array.isArray(stored.feed?.keywords)
          ? stored.feed!.keywords.filter((k): k is string => typeof k === "string" && k.trim().length > 0)
          : DEFAULT_PREFERENCES.feed.keywords,
        events: { ...DEFAULT_PREFERENCES.feed.events, ...stored.feed?.events },
        badges: { ...DEFAULT_PREFERENCES.feed.badges, ...stored.feed?.badges },
        users: {
          muted: (stored.feed?.users?.muted ?? DEFAULT_PREFERENCES.feed.users.muted).filter((s) => /^\d+$/.test(s)),
          showDisplayName: stored.feed?.users?.showDisplayName ?? DEFAULT_PREFERENCES.feed.users.showDisplayName,
          overrideNameColor: stored.feed?.users?.overrideNameColor ?? DEFAULT_PREFERENCES.feed.users.overrideNameColor,
          nicknames: sanitizeNicknames(stored.feed?.users?.nicknames),
        },
      },
      notifications: {
        mentionSound: stored.notifications?.mentionSound ?? DEFAULT_PREFERENCES.notifications.mentionSound,
      },
      moderation: {
        autoShoutoutOnRaid:
          stored.moderation?.autoShoutoutOnRaid ?? DEFAULT_PREFERENCES.moderation.autoShoutoutOnRaid,
        actionsDisabled:
          stored.moderation?.actionsDisabled ?? DEFAULT_PREFERENCES.moderation.actionsDisabled,
      },
      advanced: {
        developerMode: stored.advanced?.developerMode ?? DEFAULT_PREFERENCES.advanced.developerMode,
        showLogs: stored.advanced?.showLogs ?? DEFAULT_PREFERENCES.advanced.showLogs,
        alwaysOnTop: stored.advanced?.alwaysOnTop ?? DEFAULT_PREFERENCES.advanced.alwaysOnTop,
        autostart: stored.advanced?.autostart ?? DEFAULT_PREFERENCES.advanced.autostart,
        discordRichPresence:
          stored.advanced?.discordRichPresence ?? DEFAULT_PREFERENCES.advanced.discordRichPresence,
      },
      appearance: {
        colors: sanitizeAppearanceColors(stored.appearance?.colors),
      },
      menu: {
        channels: { pinned },
      },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

const [prefs, setPrefs] = createStore<UserPreferences>(load());

let toastTimer: number | undefined;
function persist() {
  localStorage.setItem("user_preferences", JSON.stringify(unwrap(prefs)));
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => addToast("Preferences saved", "success"), 800);
}

export const feedFontSize = () => prefs.feed.fontSize;
export const feedUserShowDisplayName = () => prefs.feed.users.showDisplayName;
export const feedShowTimestamp = () => prefs.feed.showTimestamp;
export const feedShowDeletedContent = () => prefs.feed.showDeletedContent;
export const feedShowCopypasta = () => prefs.feed.showCopypasta;
export const feedBadges = () => prefs.feed.badges as Record<BadgeCategoryKey, BadgePref>;
export const feedEvents = () => prefs.feed.events as Record<EventKey, EventPref>;
export const feedUserMuted = () => prefs.feed.users.muted;
export const feedKeywords = () => prefs.feed.keywords;
export const feedUserOverrideNameColor = () => prefs.feed.users.overrideNameColor;
export const feedUserNicknames = () => prefs.feed.users.nicknames;
export const feedUserNickname = (login: string) => prefs.feed.users.nicknames[login.toLowerCase()];
export const menuChannelPinned = () => prefs.menu.channels.pinned;
export const notificationsMentionSound = () => prefs.notifications.mentionSound;
export const moderationAutoShoutoutOnRaid = () => prefs.moderation.autoShoutoutOnRaid;
export const moderationActionsDisabled = () => prefs.moderation.actionsDisabled;
export const advancedDeveloperMode = () => prefs.advanced.developerMode;
export const advancedShowLogs = () => prefs.advanced.showLogs;
export const advancedAlwaysOnTop = () => prefs.advanced.alwaysOnTop;
export const advancedAutostart = () => prefs.advanced.autostart;
export const advancedDiscordRichPresence = () => prefs.advanced.discordRichPresence;
export const appearanceColors = () => prefs.appearance.colors;

export function setFeedFontSize(value: number) {
  setPrefs("feed", "fontSize", Math.min(24, Math.max(11, value)));
  persist();
}

export function setFeedUserShowDisplayName(value: boolean) {
  setPrefs("feed", "users", "showDisplayName", value);
  persist();
}

export function setFeedUserOverrideNameColor(value: string) {
  setPrefs("feed", "users", "overrideNameColor", value);
  persist();
}

export function setFeedShowTimestamp(value: boolean) {
  setPrefs("feed", "showTimestamp", value);
  persist();
}

export function setFeedShowDeletedContent(value: boolean) {
  setPrefs("feed", "showDeletedContent", value);
  persist();
}

export function setFeedShowCopypasta(value: boolean) {
  setPrefs("feed", "showCopypasta", value);
  persist();
}

export function setFeedBadge(key: BadgeCategoryKey, show: boolean) {
  setPrefs("feed", "badges", key, { show });
  persist();
}

export function setFeedEvent(key: EventKey, show: boolean) {
  setPrefs("feed", "events", key, { show });
  persist();
}

export function muteUser(user_id: string) {
  if (prefs.feed.users.muted.includes(user_id)) return;
  setPrefs("feed", "users", "muted", (m) => [...m, user_id]);
  persist();
}

export function unmuteUser(user_id: string) {
  setPrefs("feed", "users", "muted", (m) => m.filter((id) => id !== user_id));
  persist();
}

export function setUserNickname(login: string, nickname: string) {
  const key = login.trim().toLowerCase();
  const value = nickname.trim();
  if (!key) return;
  if (!value) {
    removeUserNickname(key);
    return;
  }
  setPrefs("feed", "users", "nicknames", key, value);
  persist();
}

export function removeUserNickname(login: string) {
  const key = login.trim().toLowerCase();
  if (!key) return;
  setPrefs("feed", "users", "nicknames", produce((n) => {
    delete n[key];
  }));
  persist();
}

export function addFeedKeyword(keyword: string) {
  const lower = keyword.trim().toLowerCase();
  if (!lower) return;
  if (prefs.feed.keywords.some((k) => k.toLowerCase() === lower)) return;
  setPrefs("feed", "keywords", (k) => [...k, lower]);
  persist();
}

export function removeFeedKeyword(keyword: string) {
  setPrefs("feed", "keywords", (k) => k.filter((x) => x !== keyword));
  persist();
}

export function matchesAnyKeyword(text: string, keywords: string[]): boolean {
  if (keywords.length === 0) return false;
  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(${escaped.join("|")})\\b`, "i").test(text);
}

export function pinChannel(user_id: string) {
  if (prefs.menu.channels.pinned.includes(user_id)) return;
  setPrefs("menu", "channels", "pinned", (p) => [...p, user_id]);
  persist();
}

export function unpinChannel(user_id: string) {
  setPrefs("menu", "channels", "pinned", (p) => p.filter((id) => id !== user_id));
  persist();
}

export function reorderPinnedChannels(from: number, to: number) {
  if (from === to) return;
  setPrefs("menu", "channels", "pinned", (p) => {
    const next = [...p];
    const [item] = next.splice(from, 1);
    next.splice(from < to ? to - 1 : to, 0, item);
    return next;
  });
  persist();
}

export function setNotificationsMentionSound(value: boolean) {
  setPrefs("notifications", "mentionSound", value);
  persist();
}

export function setModerationAutoShoutoutOnRaid(value: boolean) {
  setPrefs("moderation", "autoShoutoutOnRaid", value);
  persist();
}

export function setModerationActionsDisabled(value: boolean) {
  setPrefs("moderation", "actionsDisabled", value);
  persist();
}

export function setAdvancedDeveloperMode(value: boolean) {
  setPrefs("advanced", "developerMode", value);
  persist();
}

export function setAdvancedShowLogs(value: boolean) {
  setPrefs("advanced", "showLogs", value);
  persist();
}

export function setAdvancedAlwaysOnTop(value: boolean) {
  setPrefs("advanced", "alwaysOnTop", value);
  persist();
}

export function setAdvancedAutostart(value: boolean) {
  setPrefs("advanced", "autostart", value);
  persist();
}

export function setAdvancedDiscordRichPresence(value: boolean) {
  setPrefs("advanced", "discordRichPresence", value);
  persist();
}

export function setAppearanceColor(key: string, value: string) {
  setPrefs("appearance", "colors", key, value);
  persist();
}

export function resetAppearanceColor(key: string) {
  setPrefs("appearance", "colors", produce((c) => {
    delete c[key];
  }));
  persist();
}

export function resetAppearanceColors() {
  setPrefs("appearance", "colors", produce((c) => {
    for (const k of Object.keys(c)) delete c[k];
  }));
  persist();
}

