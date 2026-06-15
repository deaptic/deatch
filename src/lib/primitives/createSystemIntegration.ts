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
import { liveStreams } from "../stores/channels.ts";
import { activeView, selectedChannel } from "../stores/view.ts";

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
      exploreOpen: activeView() === "explore",
      liveStreams: liveStreams(),
    });
  });

  onMount(() => {
    const stopUpdateChecker = startUpdateChecker();
    onCleanup(stopUpdateChecker);
  });
}
