import type { EventKey, BadgeCategoryKey } from "./constants";
import defaults from "./default-preferences.json";

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
  };
  menu: {
    channels: {
      pinned: string[];
    };
  };
};

export const DEFAULT_PREFERENCES = defaults as UserPreferences;

function normalizePinned(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((p) => (typeof p === "string" ? p : (p && typeof p === "object" && "user_id" in p ? String((p as { user_id: unknown }).user_id) : null)))
    .filter((id): id is string => !!id);
}

function migrateLegacyPinned(): string[] | null {
  try {
    const legacy = localStorage.getItem("pinned_channels");
    if (!legacy) return null;
    localStorage.removeItem("pinned_channels");
    return normalizePinned(JSON.parse(legacy));
  } catch {
    return null;
  }
}

export function loadUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem("user_preferences");
    const stored = raw ? (JSON.parse(raw) as Partial<UserPreferences>) : {};
    const rawPinned = stored.menu?.channels?.pinned;
    const pinned = rawPinned !== undefined ? normalizePinned(rawPinned) : (migrateLegacyPinned() ?? DEFAULT_PREFERENCES.menu.channels.pinned);
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
      },
      menu: {
        channels: { pinned },
      },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: UserPreferences): void {
  localStorage.setItem("user_preferences", JSON.stringify(prefs));
}
