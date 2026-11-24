import type { Component } from "solid-js";
import {
  Ban,
  Bell,
  Code,
  Eye,
  Keyboard,
  MessageSquare,
  Palette,
  SlidersHorizontal,
  UserRound,
  Zap,
} from "lucide-solid";
import type { MessageKey } from "../../shared/i18n/index.ts";
import type { SettingsSection } from "./store.ts";

export type SettingsGroup = "app" | "chat" | "developer";

export const SETTINGS_GROUPS: { key: SettingsGroup; label?: MessageKey }[] = [
  { key: "app", label: "SETTINGS_GROUP_APP_TITLE" },
  { key: "chat", label: "SETTINGS_GROUP_CHAT_TITLE" },
  { key: "developer" },
];

export const SETTINGS_SECTIONS: {
  key: SettingsSection;
  group: SettingsGroup;
  label: MessageKey;
  icon: Component<{ class?: string }>;
}[] = [
  {
    key: "general",
    group: "app",
    label: "SETTINGS_GENERAL_TITLE",
    icon: SlidersHorizontal,
  },
  {
    key: "appearance",
    group: "app",
    label: "SETTINGS_APPEARANCE_TITLE",
    icon: Palette,
  },
  {
    key: "notifications",
    group: "app",
    label: "SETTINGS_NOTIFICATIONS_TITLE",
    icon: Bell,
  },
  {
    key: "account",
    group: "app",
    label: "SETTINGS_ACCOUNT_TITLE",
    icon: UserRound,
  },
  {
    key: "keyboard",
    group: "app",
    label: "SETTINGS_KEYBOARD_TITLE",
    icon: Keyboard,
  },
  { key: "link", group: "app", label: "SETTINGS_LINK_TITLE", icon: Eye },
  {
    key: "messages",
    group: "chat",
    label: "SETTINGS_MESSAGES_TITLE",
    icon: MessageSquare,
  },
  {
    key: "moderation",
    group: "chat",
    label: "SETTINGS_MODERATION_TITLE",
    icon: Ban,
  },
  {
    key: "triggers",
    group: "chat",
    label: "SETTINGS_TRIGGERS_TITLE",
    icon: Zap,
  },
  {
    key: "developer",
    group: "developer",
    label: "SETTINGS_DEVELOPER_TITLE",
    icon: Code,
  },
];
