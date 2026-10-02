import { createEffect } from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import {
  disable as disableAutostart,
  enable as enableAutostart,
  isEnabled as isAutostartEnabled,
} from "@tauri-apps/plugin-autostart";
import {
  advancedAlwaysOnTop,
  advancedAutostart,
  advancedDiscordRichPresence,
  appearanceAccent,
  appearanceZoom,
  feedFontSize,
  feedGroupSpacing,
} from "../stores/preferences.ts";
import { resolvedTheme } from "../stores/theme.ts";
import * as appearance from "../services/appearance.ts";
import * as discord from "../services/discord.ts";
import { user } from "../stores/users.ts";
import { liveStreams } from "../stores/channels.ts";
import { activeView, selectedChannel } from "../stores/view.ts";

export function createSystemIntegration(): void {
  createEffect(() => {
    appearance.apply({ theme: resolvedTheme(), accent: appearanceAccent() });
  });

  createEffect(() => {
    appearance.applyFeedSizing({
      fontSize: feedFontSize(),
      groupSpacing: feedGroupSpacing(),
    });
  });

  createEffect(() => {
    getCurrentWebview()
      .setZoom(appearanceZoom() / 100)
      .catch((e) => console.warn("zoom failed", e));
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
    discord.applyPresence({
      enabled: advancedDiscordRichPresence(),
      authenticated: u !== null,
      userId: u?.id ?? null,
      channel: selectedChannel(),
      exploreOpen: activeView() === "explore",
      liveStreams: liveStreams(),
    });
  });
}
