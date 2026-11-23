import { createEffect } from "solid-js";
import { setWindowTitle } from "../platform/window.ts";
import { t } from "../shared/i18n/index.ts";
import { selectedChannel } from "../features/navigation/index.ts";

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
}
