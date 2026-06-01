import { createEffect, onMount, onCleanup } from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  enable as enableAutostart,
  disable as disableAutostart,
  isEnabled as isAutostartEnabled,
} from "@tauri-apps/plugin-autostart";
import {
  advancedAlwaysOnTop,
  advancedAutostart,
  advancedDiscordRichPresence,
  appearanceColors,
} from "../stores/preferences";
import { applyAppearanceColors } from "../services/appearance";
import { applyDiscordPresence } from "../services/discord";
import { startUpdateChecker } from "../services/updater";
import { user } from "../stores/users";
import { selectedChannel, liveStreams } from "../stores/channels";
import { isPanelOpen } from "../stores/ui";

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
