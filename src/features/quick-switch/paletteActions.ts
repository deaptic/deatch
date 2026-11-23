import type { Component } from "solid-js";
import {
  Bookmark,
  ChartColumn,
  Compass,
  Eraser,
  Inbox,
  Pencil,
  Settings,
  Shield,
  Swords,
  Trophy,
  Tv,
} from "lucide-solid";
import { t } from "../../shared/i18n/index.ts";
import { startCommercial } from "../../platform/twitch/channels.ts";
import { deleteChatMessages } from "../../platform/twitch/moderation.ts";
import { createStreamMarker } from "../../platform/twitch/streams.ts";
import { AD_LENGTHS } from "../../lib/constants/twitch.ts";
import * as activity from "../activity/index.ts";
import * as chatModes from "../chat-modes/index.ts";
import { streamForUserId } from "../channels/index.ts";
import {
  type ChannelForm,
  setChannelForm,
  toggleOverlay,
} from "../../lib/stores/ui.ts";
import { showsControls } from "../../lib/stores/roles.ts";
import {
  isSettingsOpen,
  selectedChannel,
  showExplore,
  toggleSettings,
} from "../../lib/stores/view.ts";
import { CHAT_MODES, isOn, presetLabel } from "../chat-modes/index.ts";

export type PaletteAction = {
  id: string;
  label: string;
  icon: Component<{ class?: string }>;
  run: () => void;
};

function appActions(): PaletteAction[] {
  return [
    {
      id: "explore",
      label: t("QUICK_SWITCH_OPEN_EXPLORE_LABEL"),
      icon: Compass,
      run: showExplore,
    },
    {
      id: "settings",
      label: t("QUICK_SWITCH_OPEN_SETTINGS_LABEL"),
      icon: Settings,
      run: () => {
        if (!isSettingsOpen()) toggleSettings();
      },
    },
    {
      id: "inbox",
      label: t("QUICK_SWITCH_OPEN_INBOX_LABEL"),
      icon: Inbox,
      run: () => toggleOverlay("inbox"),
    },
  ];
}

function chatModeActions(broadcasterId: string): PaletteAction[] {
  const settings = chatModes.forChannel(broadcasterId);
  if (!settings) return [];
  const apply = (change: chatModes.ChatSettingsChange) => () =>
    chatModes.update(broadcasterId, change);
  return CHAT_MODES.flatMap((mode): PaletteAction[] => {
    const name = t(mode.label);
    const on = isOn(mode, settings);
    const turnOff: PaletteAction = {
      id: `mode-off-${mode.label}`,
      label: t("COMPOSER_MODE_OFF_LABEL", { mode: name }),
      icon: mode.icon,
      run: apply(mode.off),
    };
    if (mode.kind === "switch") {
      return on
        ? [turnOff]
        : [
            {
              id: `mode-on-${mode.label}`,
              label: t("COMPOSER_MODE_ON_LABEL", { mode: name }),
              icon: mode.icon,
              run: apply(mode.on),
            },
          ];
    }
    const presets = mode.presets.map((preset) => ({
      id: `mode-${mode.label}-${preset.value}`,
      label: t("QUICK_SWITCH_MODE_PRESET_LABEL", {
        mode: name,
        preset: presetLabel(preset),
      }),
      icon: mode.icon,
      run: apply(mode.set(preset.value)),
    }));
    return on ? [turnOff, ...presets] : presets;
  });
}

function moderatorActions(broadcasterId: string): PaletteAction[] {
  const shield = activity.forChannel(broadcasterId).shield;
  return [
    ...chatModeActions(broadcasterId),
    {
      id: "shield",
      label: t(shield ? "HEADER_SHIELD_OFF_LABEL" : "HEADER_SHIELD_ON_LABEL"),
      icon: Shield,
      run: () => activity.setShield(broadcasterId, !shield),
    },
    {
      id: "clear",
      label: t("HEADER_CLEAR_CHAT_LABEL"),
      icon: Eraser,
      run: () => {
        deleteChatMessages({ broadcasterId, messageId: null }).catch(() => {});
      },
    },
  ];
}

const form = (
  id: ChannelForm,
  label: string,
  icon: PaletteAction["icon"],
): PaletteAction => ({ id, label, icon, run: () => setChannelForm(id) });

function broadcasterActions(broadcasterId: string): PaletteAction[] {
  const forms = [
    form("info", t("HEADER_EDIT_INFO_LABEL"), Pencil),
    form("poll", t("HEADER_START_POLL_LABEL"), ChartColumn),
    form("prediction", t("HEADER_START_PREDICTION_LABEL"), Trophy),
    form("raid", t("HEADER_RAID_LABEL"), Swords),
  ];
  if (!streamForUserId(broadcasterId)) return forms;
  return [
    ...forms,
    {
      id: "marker",
      label: t("HEADER_ADD_MARKER_LABEL"),
      icon: Bookmark,
      run: () => {
        createStreamMarker().catch(() => {});
      },
    },
    ...AD_LENGTHS.map((length) => ({
      id: `ad-${length}`,
      label: t("QUICK_SWITCH_RUN_AD_LABEL", {
        length: t("HEADER_AD_SECONDS_VALUE", { count: length }),
      }),
      icon: Tv,
      run: () => {
        startCommercial({ broadcasterId, length }).catch(() => {});
      },
    })),
  ];
}

export function paletteActions(): PaletteAction[] {
  const channel = selectedChannel();
  const app = appActions();
  if (!channel || !showsControls(channel.id, "moderate")) return app;
  const own = showsControls(channel.id, "manageStream");
  return [
    ...(own ? broadcasterActions(channel.id) : []),
    ...moderatorActions(channel.id),
    ...app,
  ];
}
