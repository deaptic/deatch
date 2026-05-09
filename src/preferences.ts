import { createSignal } from "solid-js";
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

const DEFAULT_PREFERENCES = defaults as UserPreferences;

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

function load(): UserPreferences {
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

function save(prefs: UserPreferences): void {
  localStorage.setItem("user_preferences", JSON.stringify(prefs));
}

const initial = load();
const [feedFontSize, setFeedFontSizeSignal] = createSignal(initial.feed.fontSize);
const [feedUserShowDisplayName, setFeedUserShowDisplayNameSignal] = createSignal(initial.feed.users.showDisplayName);
const [feedShowTimestamp, setFeedShowTimestampSignal] = createSignal(initial.feed.showTimestamp);
const [feedBadges, setFeedBadgesSignal] = createSignal<Record<BadgeCategoryKey, BadgePref>>(
  initial.feed.badges as Record<BadgeCategoryKey, BadgePref>,
);
const [feedEvents, setFeedEventsSignal] = createSignal<Record<EventKey, EventPref>>(
  initial.feed.events as Record<EventKey, EventPref>,
);
const [feedUserMuted, setFeedUserMutedSignal] = createSignal<string[]>(initial.feed.users.muted);
const [menuChannelPinned, setMenuChannelPinnedSignal] = createSignal<string[]>(initial.menu.channels.pinned);
const [advancedDeveloperMode, setAdvancedDeveloperModeSignal] = createSignal(initial.advanced.developerMode);

export {
  feedFontSize,
  feedUserShowDisplayName,
  feedShowTimestamp,
  feedBadges,
  feedEvents,
  feedUserMuted,
  menuChannelPinned,
  advancedDeveloperMode,
};

export function setFeedFontSize(value: number) {
  const next = Math.min(24, Math.max(11, value));
  const prefs = load();
  save({ ...prefs, feed: { ...prefs.feed, fontSize: next } });
  setFeedFontSizeSignal(next);
}

export function setFeedUserShowDisplayName(value: boolean) {
  const prefs = load();
  save({
    ...prefs,
    feed: { ...prefs.feed, users: { ...prefs.feed.users, showDisplayName: value } },
  });
  setFeedUserShowDisplayNameSignal(value);
}

export function setFeedShowTimestamp(value: boolean) {
  const prefs = load();
  save({ ...prefs, feed: { ...prefs.feed, showTimestamp: value } });
  setFeedShowTimestampSignal(value);
}

export function setFeedBadge(key: BadgeCategoryKey, show: boolean) {
  const next = { ...feedBadges(), [key]: { show } };
  const prefs = load();
  save({ ...prefs, feed: { ...prefs.feed, badges: next } });
  setFeedBadgesSignal(next);
}

export function setFeedEvent(key: EventKey, show: boolean) {
  const next = { ...feedEvents(), [key]: { show } };
  const prefs = load();
  save({ ...prefs, feed: { ...prefs.feed, events: next } });
  setFeedEventsSignal(next);
}

export function muteUser(user_id: string) {
  if (feedUserMuted().includes(user_id)) return;
  const next = [...feedUserMuted(), user_id];
  const prefs = load();
  save({
    ...prefs,
    feed: { ...prefs.feed, users: { ...prefs.feed.users, muted: next } },
  });
  setFeedUserMutedSignal(next);
}

export function unmuteUser(user_id: string) {
  const next = feedUserMuted().filter((id) => id !== user_id);
  const prefs = load();
  save({
    ...prefs,
    feed: { ...prefs.feed, users: { ...prefs.feed.users, muted: next } },
  });
  setFeedUserMutedSignal(next);
}

function savePinned(value: string[]) {
  const prefs = load();
  save({
    ...prefs,
    menu: { ...prefs.menu, channels: { ...prefs.menu.channels, pinned: value } },
  });
  setMenuChannelPinnedSignal(value);
}

export function pinChannel(user_id: string) {
  if (menuChannelPinned().includes(user_id)) return;
  savePinned([...menuChannelPinned(), user_id]);
}

export function unpinChannel(user_id: string) {
  savePinned(menuChannelPinned().filter((id) => id !== user_id));
}

export function reorderPinnedChannels(from: number, to: number) {
  if (from === to) return;
  const next = [...menuChannelPinned()];
  const [item] = next.splice(from, 1);
  next.splice(from < to ? to - 1 : to, 0, item);
  savePinned(next);
}

export function setAdvancedDeveloperMode(value: boolean) {
  const prefs = load();
  save({
    ...prefs,
    advanced: { ...prefs.advanced, developerMode: value },
  });
  setAdvancedDeveloperModeSignal(value);
}
