import { createEffect, onCleanup, onMount } from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  disable as disableAutostart,
  enable as enableAutostart,
  isEnabled as isAutostartEnabled,
} from "@tauri-apps/plugin-autostart";
import {
  advancedAlwaysOnTop,
  advancedAutostart,
  advancedDiscordRichPresence,
  appearanceColors,
} from "../stores/preferences.ts";
import { applyAppearanceColors } from "../services/appearance.ts";
import { applyDiscordPresence } from "../services/discord.ts";
import { startUpdateChecker } from "../services/updater.ts";
import { user } from "../stores/users.ts";
import { liveStreams, selectedChannel } from "../stores/channels.ts";
import { isPanelOpen } from "../stores/ui.ts";

export function createSystemIntegration(): void {
  createEffect(() => {
    applyAppearanceColors(appearanceColors());
  });

  createEffect(() => {
    getCurrentWindow()
      .setAlwaysOnTop(advancedAlwaysOnTop())
      .catch(() => {});
  });

  createEffect(() => {
    const want = advancedAutostart();
    (async () => {
      const have = await isAutostartEnabled();
      if (have === want) return;
      await (want ? enableAutostart() : disableAutostart());
    })().catch(() => {});
  });

  createEffect(() => {
    const u = user();
    applyDiscordPresence({
      enabled: advancedDiscordRichPresence(),
      authenticated: u !== null,
      userId: u?.id ?? null,
      channel: selectedChannel(),
      inboxOpen: isPanelOpen("inbox"),
      liveStreams: liveStreams(),
    });
  });

  onMount(() => {
    const stopUpdateChecker = startUpdateChecker();
    onCleanup(stopUpdateChecker);
  });
}
