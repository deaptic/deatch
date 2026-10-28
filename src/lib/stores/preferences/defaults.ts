import type { UserPreferences } from "./schema.ts";

type Feed = UserPreferences["feed"];
type Link = UserPreferences["link"];

/// What a fresh install starts with. Events and badges left out here are
/// shown, and the compressor starts from its own defaults.
export type Defaults = Omit<UserPreferences, "feed" | "link"> & {
  feed: Omit<Feed, "events" | "badges"> & {
    events: Partial<Feed["events"]>;
    badges: Partial<Feed["badges"]>;
  };
  link: Omit<Link, "compressorSettings">;
};

export const DEFAULTS: Defaults = {
  feed: {
    fontSize: 16,
    density: "compact",
    groupSpacing: 8,
    showTimestamp: false,
    showDeletedContent: false,
    showCopypasta: false,
    showAvatars: true,
    showBadges: true,
    showEvents: true,
    keywords: [],
    events: {
      message: { show: true },
      follow: { show: true },
      sub: { show: true },
      raid: { show: true },
      announcement: { show: true },
      charity_donation: { show: true },
      bits_badge_tier: { show: true },
      shoutout: { show: true },
      moderation: { show: true },
    },
    badges: {
      authority: { show: true },
      predictions: { show: true },
      channel: { show: true },
      subscriber: { show: true },
      vanity: { show: true },
    },
    users: {
      showDisplayName: true,
      overrideNameColor: "",
    },
  },
  notifications: {
    mentionSound: true,
  },
  moderation: {
    autoShoutoutOnRaid: false,
    actionsDisabled: false,
  },
  advanced: {
    developerMode: false,
    showLogs: false,
    alwaysOnTop: false,
    autostart: false,
    discordRichPresence: false,
    hardwareAcceleration: true,
  },
  appearance: {
    theme: "system",
    accent: null,
    railExpanded: false,
    uiDensity: "default",
    zoom: 100,
  },
  link: {
    audioLink: false,
    compressor: false,
    channelGains: {},
  },
  menu: {
    channels: {
      pinned: [],
    },
  },
  explore: {
    language: "",
  },
  triggers: [],
};
