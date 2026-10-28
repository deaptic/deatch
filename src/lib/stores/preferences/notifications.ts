import { prefs, setPrefs } from "./core.ts";

export const notificationsMentionSound = () => prefs.notifications.mentionSound;

export function setNotificationsMentionSound(value: boolean) {
  setPrefs("notifications", "mentionSound", value);
}
