import { prefs, setPrefs } from "./core.ts";

export const notificationsMentionSound = () => prefs.notifications.mentionSound;
export const notificationsWhisperSound = () => prefs.notifications.whisperSound;

export function setNotificationsMentionSound(value: boolean) {
  setPrefs("notifications", "mentionSound", value);
}

export function setNotificationsWhisperSound(value: boolean) {
  setPrefs("notifications", "whisperSound", value);
}
