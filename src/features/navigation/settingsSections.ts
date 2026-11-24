import type { Component } from "solid-js";
import {
  Ban,
  Eye,
  Keyboard,
  Megaphone,
  Palette,
  Settings,
  UserX,
  Zap,
} from "lucide-solid";
import type { MessageKey } from "../../shared/i18n/index.ts";
import type { SettingsSection } from "./store.ts";

export const SETTINGS_SECTIONS: {
  key: SettingsSection;
  label: MessageKey;
  icon: Component<{ class?: string }>;
}[] = [
  {
    key: "notifications",
    label: "SETTINGS_NOTIFICATIONS_TITLE",
    icon: Megaphone,
  },
  { key: "appearance", label: "SETTINGS_APPEARANCE_TITLE", icon: Palette },
  { key: "link", label: "SETTINGS_LINK_TITLE", icon: Eye },
  { key: "moderation", label: "SETTINGS_MODERATION_TITLE", icon: Ban },
  { key: "blocked", label: "SETTINGS_BLOCKED_TITLE", icon: UserX },
  { key: "triggers", label: "SETTINGS_TRIGGERS_TITLE", icon: Zap },
  { key: "keyboard", label: "SETTINGS_KEYBOARD_TITLE", icon: Keyboard },
  { key: "advanced", label: "SETTINGS_ADVANCED_TITLE", icon: Settings },
];
