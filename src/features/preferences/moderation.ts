import { prefs, setPrefs } from "./core.ts";
import type { QuickTimeout } from "./schema/index.ts";

export const moderationAutoShoutoutOnRaid = () =>
  prefs.moderation.autoShoutoutOnRaid;
export const moderatorTools = () => prefs.moderation.moderatorTools;
export const moderationKeyboard = () => prefs.moderation.keyboard;
export const moderationQuickTimeout = () => prefs.moderation.quickTimeout;
export const moderationReasons = () => prefs.moderation.reasons;

export function setModerationAutoShoutoutOnRaid(value: boolean) {
  setPrefs("moderation", "autoShoutoutOnRaid", value);
}

export function setModeratorTools(shown: boolean) {
  setPrefs("moderation", "moderatorTools", shown);
}

export function setModerationKeyboard(value: boolean) {
  setPrefs("moderation", "keyboard", value);
}

export function setModerationQuickTimeout(value: QuickTimeout) {
  setPrefs("moderation", "quickTimeout", value);
}

export function addModerationReason(reason: string) {
  const text = reason.trim();
  if (!text || prefs.moderation.reasons.includes(text)) return;
  setPrefs("moderation", "reasons", (list) => [...list, text]);
}

export function removeModerationReason(reason: string) {
  setPrefs("moderation", "reasons", (list) => list.filter((r) => r !== reason));
}
