import type { Component } from "solid-js";
import { CopyX, Hourglass, Smile, Star, UserCheck } from "lucide-solid";
import type { ChatSettingsChange } from "./store.ts";
import { formatDuration } from "../../shared/format/duration.ts";
import { type MessageKey, t } from "../../shared/i18n/index.ts";
import type { ChatSettings } from "../../shared/types/index.ts";

type Preset = { value: number; label: MessageKey; count?: number };

type Base = {
  icon: Component<{ class?: string }>;
  label: MessageKey;
  description: (s: ChatSettings) => string;
  off: ChatSettingsChange;
};

type SwitchMode = Base & {
  kind: "switch";
  isOn: (s: ChatSettings) => boolean;
  on: ChatSettingsChange;
};

export type TimedMode = Base & {
  kind: "timed";
  offLabel: MessageKey;
  current: (s: ChatSettings) => number | null;
  short: (s: ChatSettings) => string;
  presets: Preset[];
  set: (value: number) => ChatSettingsChange;
};

export type ChatMode = SwitchMode | TimedMode;

export function isOn(mode: ChatMode, s: ChatSettings): boolean {
  return mode.kind === "timed" ? mode.current(s) !== null : mode.isOn(s);
}

export function activeModes(s: ChatSettings | undefined): ChatMode[] {
  return s ? CHAT_MODES.filter((mode) => isOn(mode, s)) : [];
}

export function presetLabel(preset: Preset): string {
  return t(preset.label, { count: preset.count });
}

const followAge = (minutes: number) => formatDuration(minutes * 60);

export const CHAT_MODES: ChatMode[] = [
  {
    kind: "timed",
    label: "COMPOSER_SLOW_MODE_LABEL",
    icon: Hourglass,
    offLabel: "COMPOSER_SLOW_MODE_OFF_LABEL",
    current: (s) => s.slowModeSeconds,
    short: (s) => formatDuration(s.slowModeSeconds ?? 0),
    presets: [
      { value: 3, label: "COMPOSER_SECONDS_VALUE", count: 3 },
      { value: 5, label: "COMPOSER_SECONDS_VALUE", count: 5 },
      { value: 10, label: "COMPOSER_SECONDS_VALUE", count: 10 },
      { value: 20, label: "COMPOSER_SECONDS_VALUE", count: 20 },
      { value: 30, label: "COMPOSER_SECONDS_VALUE", count: 30 },
      { value: 60, label: "COMPOSER_MINUTES_VALUE", count: 1 },
      { value: 120, label: "COMPOSER_MINUTES_VALUE", count: 2 },
    ],
    set: (seconds) => ({ slowMode: true, slowModeWaitTime: seconds }),
    off: { slowMode: false },
    description: (s) =>
      t("COMPOSER_SLOW_MODE_DESCRIPTION", {
        duration: formatDuration(s.slowModeSeconds ?? 0),
      }),
  },
  {
    kind: "timed",
    label: "COMPOSER_FOLLOWERS_MODE_LABEL",
    icon: UserCheck,
    offLabel: "COMPOSER_FOLLOWERS_MODE_OFF_LABEL",
    current: (s) => s.followerModeMinutes,
    short: (s) =>
      s.followerModeMinutes ? followAge(s.followerModeMinutes) : "",
    presets: [
      { value: 0, label: "COMPOSER_FOLLOWERS_MODE_ANY_LABEL" },
      { value: 10, label: "COMPOSER_MINUTES_VALUE", count: 10 },
      { value: 30, label: "COMPOSER_MINUTES_VALUE", count: 30 },
      { value: 60, label: "COMPOSER_HOURS_VALUE", count: 1 },
      { value: 1440, label: "COMPOSER_DAYS_VALUE", count: 1 },
      { value: 10080, label: "COMPOSER_WEEKS_VALUE", count: 1 },
      { value: 43200, label: "COMPOSER_MONTHS_VALUE", count: 1 },
      { value: 129600, label: "COMPOSER_MONTHS_VALUE", count: 3 },
    ],
    set: (minutes) => ({ followerMode: true, followerModeDuration: minutes }),
    off: { followerMode: false },
    description: (s) =>
      s.followerModeMinutes
        ? t("COMPOSER_FOLLOWERS_MODE_AGE_DESCRIPTION", {
            age: followAge(s.followerModeMinutes),
          })
        : t("COMPOSER_FOLLOWERS_MODE_DESCRIPTION"),
  },
  {
    kind: "switch",
    label: "COMPOSER_SUBSCRIBERS_MODE_LABEL",
    icon: Star,
    isOn: (s) => s.subscriberMode,
    on: { subscriberMode: true },
    off: { subscriberMode: false },
    description: () => t("COMPOSER_SUBSCRIBERS_MODE_DESCRIPTION"),
  },
  {
    kind: "switch",
    label: "COMPOSER_EMOTE_ONLY_MODE_LABEL",
    icon: Smile,
    isOn: (s) => s.emoteMode,
    on: { emoteMode: true },
    off: { emoteMode: false },
    description: () => t("COMPOSER_EMOTE_ONLY_MODE_DESCRIPTION"),
  },
  {
    kind: "switch",
    label: "COMPOSER_UNIQUE_MODE_LABEL",
    icon: CopyX,
    isOn: (s) => s.uniqueChatMode,
    on: { uniqueChatMode: true },
    off: { uniqueChatMode: false },
    description: () => t("COMPOSER_UNIQUE_MODE_DESCRIPTION"),
  },
];
