import type { MessageKey } from "../../../shared/i18n/index.ts";
import type { Alert } from "../../preferences/index.ts";

type AlertRow = { alert: Alert; label: MessageKey; description: MessageKey };

export const ALERT_GROUPS: { title: MessageKey; rows: AlertRow[] }[] = [
  {
    title: "SETTINGS_NOTIFICATIONS_FOLLOWED_TITLE",
    rows: [
      {
        alert: "goingLive",
        label: "SETTINGS_NOTIFICATIONS_GOING_LIVE_LABEL",
        description: "SETTINGS_NOTIFICATIONS_GOING_LIVE_DESCRIPTION",
      },
    ],
  },
  {
    title: "SETTINGS_NOTIFICATIONS_STREAM_TITLE",
    rows: [
      {
        alert: "raids",
        label: "SETTINGS_NOTIFICATIONS_RAIDS_LABEL",
        description: "SETTINGS_NOTIFICATIONS_RAIDS_DESCRIPTION",
      },
      {
        alert: "followsAndSubs",
        label: "SETTINGS_NOTIFICATIONS_FOLLOWS_AND_SUBS_LABEL",
        description: "SETTINGS_NOTIFICATIONS_FOLLOWS_AND_SUBS_DESCRIPTION",
      },
      {
        alert: "adBreaks",
        label: "SETTINGS_NOTIFICATIONS_AD_BREAKS_LABEL",
        description: "SETTINGS_NOTIFICATIONS_AD_BREAKS_DESCRIPTION",
      },
      {
        alert: "redemptions",
        label: "SETTINGS_NOTIFICATIONS_REDEMPTIONS_LABEL",
        description: "SETTINGS_NOTIFICATIONS_REDEMPTIONS_DESCRIPTION",
      },
    ],
  },
  {
    title: "SETTINGS_NOTIFICATIONS_MODERATION_TITLE",
    rows: [
      {
        alert: "automod",
        label: "SETTINGS_NOTIFICATIONS_AUTOMOD_LABEL",
        description: "SETTINGS_NOTIFICATIONS_AUTOMOD_DESCRIPTION",
      },
      {
        alert: "unbanRequests",
        label: "SETTINGS_NOTIFICATIONS_UNBAN_REQUESTS_LABEL",
        description: "SETTINGS_NOTIFICATIONS_UNBAN_REQUESTS_DESCRIPTION",
      },
    ],
  },
  {
    title: "SETTINGS_NOTIFICATIONS_SYSTEM_TITLE",
    rows: [
      {
        alert: "connection",
        label: "SETTINGS_NOTIFICATIONS_CONNECTION_LABEL",
        description: "SETTINGS_NOTIFICATIONS_CONNECTION_DESCRIPTION",
      },
    ],
  },
];
