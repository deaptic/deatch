import { prefs, setPrefs } from "./core.ts";

export const moderationAutoShoutoutOnRaid = () =>
  prefs.moderation.autoShoutoutOnRaid;
export const moderationActionsDisabled = () => prefs.moderation.actionsDisabled;

export function setModerationAutoShoutoutOnRaid(value: boolean) {
  setPrefs("moderation", "autoShoutoutOnRaid", value);
}

export function setModerationActionsDisabled(value: boolean) {
  setPrefs("moderation", "actionsDisabled", value);
}
