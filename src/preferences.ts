import type { NotifKey, BadgeCategoryKey } from "./constants";
import defaults from "./default-preferences.json";

export type EventPref = { show: boolean };
export type BadgePref = { show: boolean };

export type UserPreferences = {
  feed: {
    fontSize: number;
    showTimestamp: boolean;
    events: Partial<Record<NotifKey, EventPref>>;
    badges: Partial<Record<BadgeCategoryKey, BadgePref>>;
    users: {
      muted: string[];
      showDisplayName: boolean;
    };
  };
};

export const DEFAULT_PREFERENCES = defaults as UserPreferences;

export function loadUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem("user_preferences");
    if (!raw) return DEFAULT_PREFERENCES;
    const stored = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      feed: {
        fontSize: stored.feed?.fontSize ?? DEFAULT_PREFERENCES.feed.fontSize,
        showTimestamp: stored.feed?.showTimestamp ?? DEFAULT_PREFERENCES.feed.showTimestamp,
        events: { ...DEFAULT_PREFERENCES.feed.events, ...stored.feed?.events },
        badges: { ...DEFAULT_PREFERENCES.feed.badges, ...stored.feed?.badges },
        users: {
          muted: stored.feed?.users?.muted ?? DEFAULT_PREFERENCES.feed.users.muted,
          showDisplayName: stored.feed?.users?.showDisplayName ?? DEFAULT_PREFERENCES.feed.users.showDisplayName,
        },
      },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: UserPreferences): void {
  localStorage.setItem("user_preferences", JSON.stringify(prefs));
}
