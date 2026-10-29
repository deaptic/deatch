import { createEffect } from "solid-js";
import { setWindowTitle } from "../api/window.ts";
import { t } from "../i18n/index.ts";
import { selectedChannel } from "../stores/view.ts";
import * as sevenTv from "../services/sevenTv.ts";
import { clearChannelThirdPartyEmotes } from "../stores/emotes.ts";
import * as emotes from "../services/emotes.ts";
import * as badges from "../services/badges.ts";

export function createSelectedChannelEffects(): void {
  let lastTitle: string | null = null;
  createEffect(() => {
    const ch = selectedChannel();
    const title = ch?.displayName
      ? t("WINDOW_TITLE_CHANNEL", { channel: ch.displayName })
      : t("WINDOW_TITLE");
    if (title === lastTitle) return;
    lastTitle = title;
    setWindowTitle(title, { silent: true }).catch(() => {});
  });

  createEffect(() => {
    const broadcaster = selectedChannel();
    sevenTv.setActive(broadcaster?.id ?? null);
    if (!broadcaster) {
      clearChannelThirdPartyEmotes();
      return;
    }
    badges.loadChannel(broadcaster);
    emotes.loadChannelThirdParty(broadcaster);
  });
}
