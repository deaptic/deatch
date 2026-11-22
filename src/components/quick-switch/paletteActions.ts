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
import { t } from "../../lib/i18n/index.ts";
import { startCommercial } from "../../lib/api/twitch/channels.ts";
import { deleteChatMessages } from "../../lib/api/twitch/moderation.ts";
import { createStreamMarker } from "../../lib/api/twitch/streams.ts";
import { AD_LENGTHS } from "../../lib/constants/twitch.ts";
import * as activity from "../../lib/services/activity.ts";
import * as chatSettings from "../../lib/services/chatSettings.ts";
import { activityFor } from "../../lib/stores/activity.ts";
import { streamForUserId } from "../../lib/stores/channels.ts";
import { chatSettingsFor } from "../../lib/stores/chatSettings.ts";
import {
  type ChannelForm,
  setChannelForm,
  toggleOverlay,
} from "../../lib/stores/ui.ts";
import { canModerate, user } from "../../lib/stores/users.ts";
import {
  isSettingsOpen,
  selectedChannel,
  showExplore,
  toggleSettings,
} from "../../lib/stores/view.ts";
import { CHAT_MODES, isOn, presetLabel } from "../chat/modes.ts";

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
      label: t("PALETTE_OPEN_EXPLORE"),
      icon: Compass,
      run: showExplore,
    },
    {
      id: "settings",
      label: t("PALETTE_OPEN_SETTINGS"),
      icon: Settings,
      run: () => {
        if (!isSettingsOpen()) toggleSettings();
      },
    },
    {
      id: "inbox",
      label: t("PALETTE_OPEN_INBOX"),
      icon: Inbox,
      run: () => toggleOverlay("inbox"),
    },
  ];
}

function chatModeActions(broadcasterId: string): PaletteAction[] {
  const settings = chatSettingsFor(broadcasterId);
  if (!settings) return [];
  const apply = (change: chatSettings.ChatSettingsChange) => () =>
    chatSettings.update(broadcasterId, change);
  return CHAT_MODES.flatMap((mode): PaletteAction[] => {
    const name = t(mode.label);
    const on = isOn(mode, settings);
    const turnOff: PaletteAction = {
      id: `mode-off-${mode.label}`,
      label: t("PALETTE_TURN_OFF", { mode: name }),
      icon: mode.icon,
      run: apply(mode.off),
    };
    if (mode.kind === "switch") {
      return on
        ? [turnOff]
        : [
            {
              id: `mode-on-${mode.label}`,
              label: t("PALETTE_TURN_ON", { mode: name }),
              icon: mode.icon,
              run: apply(mode.on),
            },
          ];
    }
    const presets = mode.presets.map((preset) => ({
      id: `mode-${mode.label}-${preset.value}`,
      label: t("PALETTE_MODE_PRESET", {
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
  const shield = activityFor(broadcasterId).shield;
  return [
    ...chatModeActions(broadcasterId),
    {
      id: "shield",
      label: t(shield ? "CHANNEL_TOOLS_SHIELD_OFF" : "CHANNEL_TOOLS_SHIELD_ON"),
      icon: Shield,
      run: () => activity.setShield(broadcasterId, !shield),
    },
    {
      id: "clear",
      label: t("CHANNEL_TOOLS_CLEAR_CHAT"),
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
    form("info", t("CHANNEL_TOOLS_EDIT_INFO"), Pencil),
    form("poll", t("CHANNEL_TOOLS_START_POLL"), ChartColumn),
    form("prediction", t("CHANNEL_TOOLS_START_PREDICTION"), Trophy),
    form("raid", t("CHANNEL_TOOLS_RAID"), Swords),
  ];
  if (!streamForUserId(broadcasterId)) return forms;
  return [
    ...forms,
    {
      id: "marker",
      label: t("CHANNEL_TOOLS_ADD_MARKER"),
      icon: Bookmark,
      run: () => {
        createStreamMarker().catch(() => {});
      },
    },
    ...AD_LENGTHS.map((length) => ({
      id: `ad-${length}`,
      label: t("PALETTE_RUN_AD", {
        length: t("CHANNEL_TOOLS_AD_SECONDS", { count: length }),
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
  if (!channel || !canModerate(channel.id)) return app;
  const own = channel.id === user()?.id;
  return [
    ...(own ? broadcasterActions(channel.id) : []),
    ...moderatorActions(channel.id),
    ...app,
  ];
}
