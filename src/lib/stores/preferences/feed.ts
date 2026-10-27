import type { BadgeCategoryKey, EventKey } from "../../constants.ts";
import type { Density } from "../../constants/density.ts";
import {
  clampToStops,
  FONT_SIZE_STOPS,
  GROUP_SPACING_STOPS,
  stepStop,
} from "../../constants/accessibility.ts";
import {
  type BadgePref,
  type EventPref,
  persist,
  prefs,
  setPrefs,
} from "./core.ts";

export const feedFontSize = () => prefs.feed.fontSize;
export const feedDensity = () => prefs.feed.density;
export const feedGroupSpacing = () => prefs.feed.groupSpacing;
export const feedShowTimestamp = () => prefs.feed.showTimestamp;
export const feedShowDeletedContent = () => prefs.feed.showDeletedContent;
export const feedShowCopypasta = () => prefs.feed.showCopypasta;
export const feedShowAvatars = () => prefs.feed.showAvatars;
export const feedShowBadges = () => prefs.feed.showBadges;
export const feedShowEvents = () => prefs.feed.showEvents;
export const feedBadges = () =>
  prefs.feed.badges as Record<BadgeCategoryKey, BadgePref>;
export const feedEvents = () =>
  prefs.feed.events as Record<EventKey, EventPref>;

export function setFeedFontSize(value: number) {
  setPrefs("feed", "fontSize", clampToStops(value, FONT_SIZE_STOPS));
  persist();
}

/// One stop smaller or larger, staying on the scale's ends.
export function stepFeedFontSize(direction: 1 | -1) {
  setFeedFontSize(stepStop(feedFontSize(), FONT_SIZE_STOPS, direction));
}

export function setFeedGroupSpacing(value: number) {
  setPrefs("feed", "groupSpacing", clampToStops(value, GROUP_SPACING_STOPS));
  persist();
}

export function stepFeedGroupSpacing(direction: 1 | -1) {
  setFeedGroupSpacing(
    stepStop(feedGroupSpacing(), GROUP_SPACING_STOPS, direction),
  );
}

export function setFeedDensity(value: Density) {
  setPrefs("feed", "density", value);
  persist();
}

export function toggleFeedDensity() {
  setFeedDensity(feedDensity() === "compact" ? "comfortable" : "compact");
}

export function setFeedShowTimestamp(value: boolean) {
  setPrefs("feed", "showTimestamp", value);
  persist();
}

export function setFeedShowDeletedContent(value: boolean) {
  setPrefs("feed", "showDeletedContent", value);
  persist();
}

export function setFeedShowAvatars(value: boolean) {
  setPrefs("feed", "showAvatars", value);
  persist();
}

export function setFeedShowBadges(value: boolean) {
  setPrefs("feed", "showBadges", value);
  persist();
}

export function setFeedShowEvents(value: boolean) {
  setPrefs("feed", "showEvents", value);
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
