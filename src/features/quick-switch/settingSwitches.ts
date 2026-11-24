import type { MessageKey } from "../../shared/i18n/index.ts";
import type { SettingsSection } from "../navigation/index.ts";
import * as prefs from "../preferences/index.ts";

export type SettingSwitch = {
  section: SettingsSection;
  label: MessageKey;
  get: () => boolean;
  set: (on: boolean) => void;
};

export const SETTING_SWITCHES: SettingSwitch[] = [
  {
    section: "notifications",
    label: "SETTINGS_NOTIFICATIONS_MENTIONS_LABEL",
    get: prefs.notificationsMentionSound,
    set: prefs.setNotificationsMentionSound,
  },
  {
    section: "messages",
    label: "SETTINGS_MESSAGES_GROUPING_LABEL",
    get: prefs.feedGroupMessages,
    set: prefs.setFeedGroupMessages,
  },
  {
    section: "messages",
    label: "SETTINGS_MESSAGES_TIMESTAMPS_LABEL",
    get: prefs.feedShowTimestamp,
    set: prefs.setFeedShowTimestamp,
  },
  {
    section: "messages",
    label: "SETTINGS_MESSAGES_AVATARS_LABEL",
    get: prefs.feedShowAvatars,
    set: prefs.setFeedShowAvatars,
  },
  {
    section: "messages",
    label: "SETTINGS_MESSAGES_DELETED_LABEL",
    get: prefs.feedShowDeletedContent,
    set: prefs.setFeedShowDeletedContent,
  },
  {
    section: "messages",
    label: "SETTINGS_MESSAGES_COPYPASTA_LABEL",
    get: prefs.feedShowCopypasta,
    set: prefs.setFeedShowCopypasta,
  },
  {
    section: "messages",
    label: "SETTINGS_MESSAGES_DISPLAY_NAMES_LABEL",
    get: prefs.feedUserShowDisplayName,
    set: prefs.setFeedUserShowDisplayName,
  },
  {
    section: "messages",
    label: "SETTINGS_MESSAGES_BADGES_SHOW_LABEL",
    get: prefs.feedShowBadges,
    set: prefs.setFeedShowBadges,
  },
  {
    section: "messages",
    label: "SETTINGS_MESSAGES_EVENTS_SHOW_LABEL",
    get: prefs.feedShowEvents,
    set: prefs.setFeedShowEvents,
  },
  {
    section: "link",
    label: "SETTINGS_LINK_COMPRESSOR_LABEL",
    get: prefs.linkCompressor,
    set: prefs.setLinkCompressor,
  },
  {
    section: "moderation",
    label: "SETTINGS_MODERATION_SHOUTOUT_RAIDERS_LABEL",
    get: prefs.moderationAutoShoutoutOnRaid,
    set: prefs.setModerationAutoShoutoutOnRaid,
  },
  {
    section: "moderation",
    label: "SETTINGS_MODERATION_HIDE_ACTIONS_LABEL",
    get: prefs.moderationActionsDisabled,
    set: prefs.setModerationActionsDisabled,
  },
  {
    section: "general",
    label: "SETTINGS_GENERAL_ALWAYS_ON_TOP_LABEL",
    get: prefs.generalAlwaysOnTop,
    set: prefs.setGeneralAlwaysOnTop,
  },
  {
    section: "general",
    label: "SETTINGS_GENERAL_AUTOSTART_LABEL",
    get: prefs.generalAutostart,
    set: prefs.setGeneralAutostart,
  },
  {
    section: "general",
    label: "SETTINGS_GENERAL_DISCORD_PRESENCE_LABEL",
    get: prefs.generalDiscordRichPresence,
    set: prefs.setGeneralDiscordRichPresence,
  },
  {
    section: "developer",
    label: "SETTINGS_DEVELOPER_MODE_LABEL",
    get: prefs.developerMode,
    set: prefs.setDeveloperMode,
  },
  {
    section: "developer",
    label: "SETTINGS_DEVELOPER_SHOW_LOGS_LABEL",
    get: prefs.developerShowLogs,
    set: prefs.setDeveloperShowLogs,
  },
];
