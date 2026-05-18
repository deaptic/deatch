import { createSignal } from "solid-js";

export const [settingsOpen, setSettingsOpen] = createSignal(false);
export const [inboxOpen, setInboxOpen] = createSignal(false);
export const [accountOpen, setAccountOpen] = createSignal(false);
export const [emotePickerOpen, setEmotePickerOpen] = createSignal(false);

export function openSettings() {
  setInboxOpen(false);
  setAccountOpen(false);
  setEmotePickerOpen(false);
  setSettingsOpen(true);
}

export function openInbox() {
  setSettingsOpen(false);
  setAccountOpen(false);
  setEmotePickerOpen(false);
  setInboxOpen(true);
}

export function openAccount() {
  setSettingsOpen(false);
  setInboxOpen(false);
  setEmotePickerOpen(false);
  setAccountOpen(true);
}

export function openEmotePicker() {
  setSettingsOpen(false);
  setInboxOpen(false);
  setAccountOpen(false);
  setEmotePickerOpen(true);
}
