import { updateChatSettings } from "../../lib/api/twitch/chat.ts";
import { formatShortDuration } from "../../lib/format/duration.ts";
import type {
  ChatSettings,
  UpdateChatSettingsParams,
} from "../../lib/types/index.ts";

type Change = Omit<UpdateChatSettingsParams, "broadcasterId">;

type Preset = { value: number; label: string };

type Base = {
  label: string;
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
  current: (s: ChatSettings) => number | null;
  presets: Preset[];
  set: (value: number) => Change;
};

export type ChatMode = SwitchMode | TimedMode;

export function isOn(mode: ChatMode, s: ChatSettings): boolean {
  return mode.kind === "timed" ? mode.current(s) !== null : mode.isOn(s);
}

const followAge = (minutes: number) => formatShortDuration(minutes * 60);

export const CHAT_MODES: ChatMode[] = [
  {
    kind: "timed",
    label: "Slow mode",
    current: (s) => s.slowModeSeconds,
    presets: [
      { value: 3, label: "3 seconds" },
      { value: 5, label: "5 seconds" },
      { value: 10, label: "10 seconds" },
      { value: 20, label: "20 seconds" },
      { value: 30, label: "30 seconds" },
      { value: 60, label: "1 minute" },
      { value: 120, label: "2 minutes" },
    ],
    set: (seconds) => ({ slowMode: true, slowModeWaitTime: seconds }),
    off: { slowMode: false },
    chip: (s) => `Slow ${formatShortDuration(s.slowModeSeconds ?? 0)}`,
    description: (s) =>
      `One message every ${formatShortDuration(s.slowModeSeconds ?? 0)}`,
  },
  {
    kind: "timed",
    label: "Followers-only",
    current: (s) => s.followerModeMinutes,
    presets: [
      { value: 0, label: "Any follower" },
      { value: 10, label: "10 minutes" },
      { value: 30, label: "30 minutes" },
      { value: 60, label: "1 hour" },
      { value: 1440, label: "1 day" },
      { value: 10080, label: "1 week" },
      { value: 43200, label: "1 month" },
      { value: 129600, label: "3 months" },
    ],
    set: (minutes) => ({ followerMode: true, followerModeDuration: minutes }),
    off: { followerMode: false },
    chip: (s) =>
      s.followerModeMinutes
        ? `Followers ${followAge(s.followerModeMinutes)}`
        : "Followers only",
    description: (s) =>
      s.followerModeMinutes
        ? `Only chatters who followed ${
          followAge(s.followerModeMinutes)
        } ago or more`
        : "Only followers can chat",
  },
  {
    kind: "switch",
    label: "Subscribers-only",
    isOn: (s) => s.subscriberMode,
    on: { subscriberMode: true },
    off: { subscriberMode: false },
    chip: () => "Subs only",
    description: () => "Only subscribers can chat",
  },
  {
    kind: "switch",
    label: "Emote-only",
    isOn: (s) => s.emoteMode,
    on: { emoteMode: true },
    off: { emoteMode: false },
    chip: () => "Emote only",
    description: () => "Messages can only contain emotes",
  },
  {
    kind: "switch",
    label: "Unique chat",
    isOn: (s) => s.uniqueChatMode,
    on: { uniqueChatMode: true },
    off: { uniqueChatMode: false },
    chip: () => "Unique chat",
    description: () => "Repeated messages are blocked",
  },
];

export function applyChatMode(broadcasterId: string, change: Change) {
  void updateChatSettings(
    { broadcasterId, ...change },
    { successMessage: undefined },
  ).catch(() => {});
}
