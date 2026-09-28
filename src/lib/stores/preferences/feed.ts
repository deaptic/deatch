import type { BadgeCategoryKey, EventKey } from "../../constants.ts";
import {
  type BadgePref,
  type EventPref,
  persist,
  prefs,
  setPrefs,
} from "./core.ts";

export const feedFontSize = () => prefs.feed.fontSize;
export const feedShowTimestamp = () => prefs.feed.showTimestamp;
export const feedShowDeletedContent = () => prefs.feed.showDeletedContent;
export const feedShowCopypasta = () => prefs.feed.showCopypasta;
export const feedBadges = () =>
  prefs.feed.badges as Record<BadgeCategoryKey, BadgePref>;
export const feedEvents = () =>
  prefs.feed.events as Record<EventKey, EventPref>;

export function setFeedFontSize(value: number) {
  setPrefs("feed", "fontSize", Math.min(22, Math.max(12, value)));
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
