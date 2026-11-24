import type { MessageKey } from "../../../shared/i18n/index.ts";

type AlertRow = { label: MessageKey; description: MessageKey };

export const ALERT_GROUPS: { title: MessageKey; rows: AlertRow[] }[] = [
  {
    title: "SETTINGS_NOTIFICATIONS_FOLLOWED_TITLE",
    rows: [
      {
        label: "SETTINGS_NOTIFICATIONS_GOING_LIVE_LABEL",
        description: "SETTINGS_NOTIFICATIONS_GOING_LIVE_DESCRIPTION",
      },
    ],
  },
  {
    title: "SETTINGS_NOTIFICATIONS_STREAM_TITLE",
    rows: [
      {
        label: "SETTINGS_NOTIFICATIONS_RAIDS_LABEL",
        description: "SETTINGS_NOTIFICATIONS_RAIDS_DESCRIPTION",
      },
      {
        label: "SETTINGS_NOTIFICATIONS_FOLLOWS_LABEL",
        description: "SETTINGS_NOTIFICATIONS_FOLLOWS_DESCRIPTION",
      },
      {
        label: "SETTINGS_NOTIFICATIONS_SUBS_LABEL",
        description: "SETTINGS_NOTIFICATIONS_SUBS_DESCRIPTION",
      },
      {
        label: "SETTINGS_NOTIFICATIONS_BITS_LABEL",
        description: "SETTINGS_NOTIFICATIONS_BITS_DESCRIPTION",
      },
      {
        label: "SETTINGS_NOTIFICATIONS_REDEMPTIONS_LABEL",
        description: "SETTINGS_NOTIFICATIONS_REDEMPTIONS_DESCRIPTION",
      },
    ],
  },
  {
    title: "SETTINGS_NOTIFICATIONS_MODERATION_TITLE",
    rows: [
      {
        label: "SETTINGS_NOTIFICATIONS_AUTOMOD_LABEL",
        description: "SETTINGS_NOTIFICATIONS_AUTOMOD_DESCRIPTION",
      },
    ],
  },
  {
    title: "SETTINGS_NOTIFICATIONS_SYSTEM_TITLE",
    rows: [
      {
        label: "SETTINGS_NOTIFICATIONS_CONNECTION_LABEL",
        description: "SETTINGS_NOTIFICATIONS_CONNECTION_DESCRIPTION",
      },
    ],
  },
];
