import { prefs, setPrefs } from "./core.ts";

export const notificationsMentionSound = () => prefs.notifications.mentionSound;
export const notificationsWhisperSound = () => prefs.notifications.whisperSound;

export function setNotificationsMentionSound(value: boolean) {
  setPrefs("notifications", "mentionSound", value);
}

export function setNotificationsWhisperSound(value: boolean) {
  setPrefs("notifications", "whisperSound", value);
}

export type Alert =
  | "goingLive"
  | "raids"
  | "followsAndSubs"
  | "adBreaks"
  | "redemptions"
  | "automod"
  | "unbanRequests"
  | "connection";

export const alertOn = (alert: Alert) => prefs.notifications[alert];

export function setAlertOn(alert: Alert, on: boolean) {
  setPrefs("notifications", alert, on);
}
