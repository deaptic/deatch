import { updateChatSettings } from "../../lib/api/twitch/chat.ts";
import { formatDuration } from "../../lib/format/duration.ts";
import { type MessageKey, t } from "../../lib/i18n/index.ts";
import type {
  ChatSettings,
  UpdateChatSettingsParams,
} from "../../lib/types/index.ts";

type Change = Omit<UpdateChatSettingsParams, "broadcasterId">;

type Preset = { value: number; label: MessageKey; count?: number };

type Base = {
  label: MessageKey;
  chip: (s: ChatSettings) => string;
  description: (s: ChatSettings) => string;
  off: Change;
};

type SwitchMode = Base & {
  kind: "switch";
  isOn: (s: ChatSettings) => boolean;
  on: Change;
};

export type TimedMode = Base & {
  kind: "timed";
  offLabel: MessageKey;
  current: (s: ChatSettings) => number | null;
  presets: Preset[];
  set: (value: number) => Change;
};

export type ChatMode = SwitchMode | TimedMode;

export function isOn(mode: ChatMode, s: ChatSettings): boolean {
  return mode.kind === "timed" ? mode.current(s) !== null : mode.isOn(s);
}

export function presetLabel(preset: Preset): string {
  return t(preset.label, { count: preset.count });
}

const followAge = (minutes: number) => formatDuration(minutes * 60);

export const CHAT_MODES: ChatMode[] = [
  {
    kind: "timed",
    label: "CHAT_MODE_SLOW",
    offLabel: "CHAT_MODE_SLOW_OFF",
    current: (s) => s.slowModeSeconds,
    presets: [
      { value: 3, label: "CHAT_MODE_SECONDS", count: 3 },
      { value: 5, label: "CHAT_MODE_SECONDS", count: 5 },
      { value: 10, label: "CHAT_MODE_SECONDS", count: 10 },
      { value: 20, label: "CHAT_MODE_SECONDS", count: 20 },
      { value: 30, label: "CHAT_MODE_SECONDS", count: 30 },
      { value: 60, label: "CHAT_MODE_MINUTES", count: 1 },
      { value: 120, label: "CHAT_MODE_MINUTES", count: 2 },
    ],
    set: (seconds) => ({ slowMode: true, slowModeWaitTime: seconds }),
    off: { slowMode: false },
    chip: (s) =>
      t("CHAT_MODE_SLOW_CHIP", {
        duration: formatDuration(s.slowModeSeconds ?? 0),
      }),
    description: (s) =>
      t("CHAT_MODE_SLOW_DESCRIPTION", {
        duration: formatDuration(s.slowModeSeconds ?? 0),
      }),
  },
  {
    kind: "timed",
    label: "CHAT_MODE_FOLLOWERS",
    offLabel: "CHAT_MODE_FOLLOWERS_OFF",
    current: (s) => s.followerModeMinutes,
    presets: [
      { value: 0, label: "CHAT_MODE_FOLLOWERS_ANY" },
      { value: 10, label: "CHAT_MODE_MINUTES", count: 10 },
      { value: 30, label: "CHAT_MODE_MINUTES", count: 30 },
      { value: 60, label: "CHAT_MODE_HOURS", count: 1 },
      { value: 1440, label: "CHAT_MODE_DAYS", count: 1 },
      { value: 10080, label: "CHAT_MODE_WEEKS", count: 1 },
      { value: 43200, label: "CHAT_MODE_MONTHS", count: 1 },
      { value: 129600, label: "CHAT_MODE_MONTHS", count: 3 },
    ],
    set: (minutes) => ({ followerMode: true, followerModeDuration: minutes }),
    off: { followerMode: false },
    chip: (s) =>
      s.followerModeMinutes
        ? t("CHAT_MODE_FOLLOWERS_CHIP_AGE", {
            age: followAge(s.followerModeMinutes),
          })
        : t("CHAT_MODE_FOLLOWERS_CHIP"),
    description: (s) =>
      s.followerModeMinutes
        ? t("CHAT_MODE_FOLLOWERS_DESCRIPTION_AGE", {
            age: followAge(s.followerModeMinutes),
          })
        : t("CHAT_MODE_FOLLOWERS_DESCRIPTION"),
  },
  {
    kind: "switch",
    label: "CHAT_MODE_SUBSCRIBERS",
    isOn: (s) => s.subscriberMode,
    on: { subscriberMode: true },
    off: { subscriberMode: false },
    chip: () => t("CHAT_MODE_SUBSCRIBERS_CHIP"),
    description: () => t("CHAT_MODE_SUBSCRIBERS_DESCRIPTION"),
  },
  {
    kind: "switch",
    label: "CHAT_MODE_EMOTE_ONLY",
    isOn: (s) => s.emoteMode,
    on: { emoteMode: true },
    off: { emoteMode: false },
    chip: () => t("CHAT_MODE_EMOTE_ONLY_CHIP"),
    description: () => t("CHAT_MODE_EMOTE_ONLY_DESCRIPTION"),
  },
  {
    kind: "switch",
    label: "CHAT_MODE_UNIQUE",
    isOn: (s) => s.uniqueChatMode,
    on: { uniqueChatMode: true },
    off: { uniqueChatMode: false },
    chip: () => t("CHAT_MODE_UNIQUE"),
    description: () => t("CHAT_MODE_UNIQUE_DESCRIPTION"),
  },
];

export function applyChatMode(broadcasterId: string, change: Change) {
  void updateChatSettings(
    { broadcasterId, ...change },
    { successMessage: false },
  ).catch(() => {});
}
