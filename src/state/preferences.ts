import { createStore, unwrap } from "solid-js/store";
import type { EventKey, BadgeCategoryKey } from "../constants";
import defaults from "../default-preferences.json";

export type EventPref = { show: boolean };
export type BadgePref = { show: boolean };

export type UserPreferences = {
  feed: {
    fontSize: number;
    showTimestamp: boolean;
    events: Partial<Record<EventKey, EventPref>>;
    badges: Partial<Record<BadgeCategoryKey, BadgePref>>;
    users: {
      muted: string[];
      showDisplayName: boolean;
    };
  };
  advanced: {
    developerMode: boolean;
    showLogs: boolean;
  };
  menu: {
    channels: {
      pinned: string[];
    };
  };
};

const DEFAULT_PREFERENCES = defaults as UserPreferences;

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
        events: { ...DEFAULT_PREFERENCES.feed.events, ...stored.feed?.events },
        badges: { ...DEFAULT_PREFERENCES.feed.badges, ...stored.feed?.badges },
        users: {
          muted: (stored.feed?.users?.muted ?? DEFAULT_PREFERENCES.feed.users.muted).filter((s) => /^\d+$/.test(s)),
          showDisplayName: stored.feed?.users?.showDisplayName ?? DEFAULT_PREFERENCES.feed.users.showDisplayName,
        },
      },
      advanced: {
        developerMode: stored.advanced?.developerMode ?? DEFAULT_PREFERENCES.advanced.developerMode,
        showLogs: stored.advanced?.showLogs ?? DEFAULT_PREFERENCES.advanced.showLogs,
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

function persist() {
  localStorage.setItem("user_preferences", JSON.stringify(unwrap(prefs)));
}

export const feedFontSize = () => prefs.feed.fontSize;
export const feedUserShowDisplayName = () => prefs.feed.users.showDisplayName;
export const feedShowTimestamp = () => prefs.feed.showTimestamp;
export const feedBadges = () => prefs.feed.badges as Record<BadgeCategoryKey, BadgePref>;
export const feedEvents = () => prefs.feed.events as Record<EventKey, EventPref>;
export const feedUserMuted = () => prefs.feed.users.muted;
export const menuChannelPinned = () => prefs.menu.channels.pinned;
export const advancedDeveloperMode = () => prefs.advanced.developerMode;
export const advancedShowLogs = () => prefs.advanced.showLogs;

export function setFeedFontSize(value: number) {
  setPrefs("feed", "fontSize", Math.min(24, Math.max(11, value)));
  persist();
}

export function setFeedUserShowDisplayName(value: boolean) {
  setPrefs("feed", "users", "showDisplayName", value);
  persist();
}

export function setFeedShowTimestamp(value: boolean) {
  setPrefs("feed", "showTimestamp", value);
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

export function setAdvancedDeveloperMode(value: boolean) {
  setPrefs("advanced", "developerMode", value);
  persist();
}

export function setAdvancedShowLogs(value: boolean) {
  setPrefs("advanced", "showLogs", value);
  persist();
}
