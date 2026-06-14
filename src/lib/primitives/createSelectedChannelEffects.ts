import { createEffect } from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { selectedChannel } from "../stores/view.ts";
import { sevenTvManager } from "../managers/SevenTvManager.ts";
import { clearChannelThirdPartyEmotes } from "../stores/emotes.ts";
import { loadChannelThirdPartyEmotes } from "../services/emotes.ts";
import { loadChannelBadges } from "../services/badges.ts";

export function createSelectedChannelEffects(): void {
  createEffect(() => {
    const ch = selectedChannel();
    const title = ch?.displayName ? `${ch.displayName} - Deatch` : "Deatch";
    getCurrentWindow()
      .setTitle(title)
      .catch(() => {});
  });

  createEffect(() => {
    const broadcaster = selectedChannel();
    sevenTvManager.setActive(broadcaster?.id ?? null);
    if (!broadcaster) {
      clearChannelThirdPartyEmotes();
      return;
    }
    loadChannelBadges(broadcaster.id);
    loadChannelThirdPartyEmotes(broadcaster.id, broadcaster.login);
  });
}
