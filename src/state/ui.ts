import { createSignal } from "solid-js";

export const [settingsOpen, setSettingsOpen] = createSignal(false);
export const [inboxOpen, setInboxOpen] = createSignal(false);
export const [emotePickerOpen, setEmotePickerOpen] = createSignal(false);

export function openSettings() {
  setInboxOpen(false);
  setEmotePickerOpen(false);
  setSettingsOpen(true);
}

export function openInbox() {
  setSettingsOpen(false);
  setEmotePickerOpen(false);
  setInboxOpen(true);
}

export function openEmotePicker() {
  setSettingsOpen(false);
  setInboxOpen(false);
  setEmotePickerOpen(true);
}
