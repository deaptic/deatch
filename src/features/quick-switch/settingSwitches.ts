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
    label: "SETTINGS_NOTIFICATIONS_MENTION_SOUND_LABEL",
    get: prefs.notificationsMentionSound,
    set: prefs.setNotificationsMentionSound,
  },
  {
    section: "appearance",
    label: "SETTINGS_APPEARANCE_GROUPING_LABEL",
    get: prefs.feedGroupMessages,
    set: prefs.setFeedGroupMessages,
  },
  {
    section: "appearance",
    label: "SETTINGS_APPEARANCE_TIMESTAMPS_LABEL",
    get: prefs.feedShowTimestamp,
    set: prefs.setFeedShowTimestamp,
  },
  {
    section: "appearance",
    label: "SETTINGS_APPEARANCE_AVATARS_LABEL",
    get: prefs.feedShowAvatars,
    set: prefs.setFeedShowAvatars,
  },
  {
    section: "appearance",
    label: "SETTINGS_APPEARANCE_DELETED_LABEL",
    get: prefs.feedShowDeletedContent,
    set: prefs.setFeedShowDeletedContent,
  },
  {
    section: "appearance",
    label: "SETTINGS_APPEARANCE_COPYPASTA_LABEL",
    get: prefs.feedShowCopypasta,
    set: prefs.setFeedShowCopypasta,
  },
  {
    section: "appearance",
    label: "SETTINGS_APPEARANCE_DISPLAY_NAMES_LABEL",
    get: prefs.feedUserShowDisplayName,
    set: prefs.setFeedUserShowDisplayName,
  },
  {
    section: "appearance",
    label: "SETTINGS_APPEARANCE_BADGES_SHOW_LABEL",
    get: prefs.feedShowBadges,
    set: prefs.setFeedShowBadges,
  },
  {
    section: "appearance",
    label: "SETTINGS_APPEARANCE_EVENTS_SHOW_LABEL",
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
    section: "advanced",
    label: "SETTINGS_ADVANCED_ALWAYS_ON_TOP_LABEL",
    get: prefs.advancedAlwaysOnTop,
    set: prefs.setAdvancedAlwaysOnTop,
  },
  {
    section: "advanced",
    label: "SETTINGS_ADVANCED_AUTOSTART_LABEL",
    get: prefs.advancedAutostart,
    set: prefs.setAdvancedAutostart,
  },
  {
    section: "advanced",
    label: "SETTINGS_ADVANCED_DISCORD_PRESENCE_LABEL",
    get: prefs.advancedDiscordRichPresence,
    set: prefs.setAdvancedDiscordRichPresence,
  },
  {
    section: "advanced",
    label: "SETTINGS_ADVANCED_DEVELOPER_MODE_LABEL",
    get: prefs.advancedDeveloperMode,
    set: prefs.setAdvancedDeveloperMode,
  },
  {
    section: "advanced",
    label: "SETTINGS_ADVANCED_SHOW_LOGS_LABEL",
    get: prefs.advancedShowLogs,
    set: prefs.setAdvancedShowLogs,
  },
];
