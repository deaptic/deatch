import type { Component } from "solid-js";
import {
  Ban,
  Bell,
  Code,
  Eye,
  Keyboard,
  MessageSquare,
  Palette,
  Languages,
  Monitor,
  Timer,
  UserRound,
  Zap,
} from "lucide-solid";
import type { MessageKey } from "../../shared/i18n/index.ts";
import type { SettingsSection } from "./store.ts";

export type SettingsGroup = "you" | "experience" | "tools" | "end";

export const SETTINGS_GROUPS: { key: SettingsGroup; label?: MessageKey }[] = [
  { key: "you" },
  { key: "experience", label: "SETTINGS_GROUP_EXPERIENCE_TITLE" },
  { key: "tools", label: "SETTINGS_GROUP_TOOLS_TITLE" },
  { key: "end" },
];

export const SETTINGS_SECTIONS: {
  key: SettingsSection;
  group: SettingsGroup;
  label: MessageKey;
  icon: Component<{ class?: string }>;
}[] = [
  {
    key: "account",
    group: "you",
    label: "SETTINGS_ACCOUNT_TITLE",
    icon: UserRound,
  },
  {
    key: "notifications",
    group: "you",
    label: "SETTINGS_NOTIFICATIONS_TITLE",
    icon: Bell,
  },
  {
    key: "appearance",
    group: "experience",
    label: "SETTINGS_APPEARANCE_TITLE",
    icon: Palette,
  },
  {
    key: "messages",
    group: "experience",
    label: "SETTINGS_MESSAGES_TITLE",
    icon: MessageSquare,
  },
  {
    key: "language",
    group: "experience",
    label: "SETTINGS_LANGUAGE_TITLE",
    icon: Languages,
  },
  {
    key: "system",
    group: "experience",
    label: "SETTINGS_SYSTEM_TITLE",
    icon: Monitor,
  },
  {
    key: "keyboard",
    group: "experience",
    label: "SETTINGS_KEYBOARD_TITLE",
    icon: Keyboard,
  },
  {
    key: "moderation",
    group: "tools",
    label: "SETTINGS_MODERATION_TITLE",
    icon: Ban,
  },
  {
    key: "triggers",
    group: "tools",
    label: "SETTINGS_TRIGGERS_TITLE",
    icon: Zap,
  },
  {
    key: "timers",
    group: "tools",
    label: "SETTINGS_TIMERS_TITLE",
    icon: Timer,
  },
  { key: "link", group: "tools", label: "SETTINGS_LINK_TITLE", icon: Eye },
  {
    key: "developer",
    group: "end",
    label: "SETTINGS_DEVELOPER_TITLE",
    icon: Code,
  },
];
