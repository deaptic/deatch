import { createEffect } from "solid-js";
import { isAutostartEnabled, setAutostart } from "../api/autostart.ts";
import { setAlwaysOnTop, setZoom } from "../api/window.ts";
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
import { t } from "../i18n/index.ts";

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
    setZoom(appearanceZoom() / 100, { silent: true }).catch(() => {});
  });

  createEffect(() => {
    setAlwaysOnTop(advancedAlwaysOnTop(), {
      failureMessage: t("SYSTEM_ALWAYS_ON_TOP_FAILED"),
    }).catch(() => {});
  });

  createEffect(() => {
    const want = advancedAutostart();
    const options = { failureMessage: t("SYSTEM_AUTOSTART_FAILED") };
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
