import { createEffect } from "solid-js";
import { setWindowTitle } from "../../platform/window.ts";
import { t } from "../../shared/i18n/index.ts";
import { selectedChannel } from "../stores/view.ts";
import * as sevenTv from "../services/sevenTv.ts";
import { clearChannelEmotes } from "../stores/emotes.ts";
import * as emotes from "../services/emotes.ts";
import * as badges from "../services/badges.ts";

export function createSelectedChannelEffects(): void {
  let lastTitle: string | null = null;
  createEffect(() => {
    const ch = selectedChannel();
    const title = ch?.displayName
      ? t("WINDOW_CHANNEL_TITLE", { channel: ch.displayName })
      : t("WINDOW_DEFAULT_TITLE");
    if (title === lastTitle) return;
    lastTitle = title;
    setWindowTitle(title, { silent: true }).catch(() => {});
  });

  createEffect(() => {
    const broadcaster = selectedChannel();
    sevenTv.setActive(broadcaster?.id ?? null);
    if (!broadcaster) {
      clearChannelEmotes();
      return;
    }
    badges.loadChannel(broadcaster);
    emotes.loadChannel(broadcaster);
  });
}
