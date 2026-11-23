import { createEffect } from "solid-js";
import { isAutostartEnabled, setAutostart } from "../../platform/autostart.ts";
import { setAlwaysOnTop, setZoom } from "../../platform/window.ts";
import {
  advancedAlwaysOnTop,
  advancedAutostart,
  advancedDiscordRichPresence,
  appearanceAccent,
  appearanceUiDensity,
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
import { t } from "../../shared/i18n/index.ts";

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
