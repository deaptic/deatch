import { createEffect } from "solid-js";
import { isAutostartEnabled, setAutostart } from "../platform/autostart.ts";
import { setAlwaysOnTop, setZoom } from "../platform/window.ts";
import {
  advancedAlwaysOnTop,
  advancedAutostart,
  advancedDiscordRichPresence,
  appearanceAccent,
  appearanceUiDensity,
  appearanceZoom,
  feedFontSize,
  feedGroupSpacing,
} from "../features/preferences/index.ts";
import { resolvedTheme, appearance } from "../features/appearance/index.ts";
import * as discord from "./discord.ts";
import { user } from "../features/users/index.ts";
import { liveStreams } from "../features/channels/index.ts";
import { activeView, selectedChannel } from "../features/navigation/index.ts";
import { t } from "../shared/i18n/index.ts";

export function createSystemIntegration(): void {
  createEffect(() => {
    appearance.apply({
      theme: resolvedTheme(),
      accent: appearanceAccent(),
      density: appearanceUiDensity(),
    });
  });

  createEffect(() => {
    appearance.applyFeedSizing({
      fontSize: feedFontSize(),
      groupSpacing: feedGroupSpacing(),
    });
  });

  createEffect(() => {
    setZoom(appearanceZoom() / 100, { silent: true }).catch(() => {});
  });

  createEffect(() => {
    setAlwaysOnTop(advancedAlwaysOnTop(), {
      failureMessage: t("SETTINGS_ADVANCED_ALWAYS_ON_TOP_ERROR"),
    }).catch(() => {});
  });

  createEffect(() => {
    const want = advancedAutostart();
    const options = { failureMessage: t("SETTINGS_ADVANCED_AUTOSTART_ERROR") };
    isAutostartEnabled(options)
      .then((have) => (have === want ? undefined : setAutostart(want, options)))
      .catch(() => {});
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
