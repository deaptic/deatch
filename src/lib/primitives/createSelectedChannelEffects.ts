import { createEffect } from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { selectedChannel } from "../stores/view.ts";
import * as sevenTv from "../services/sevenTv.ts";
import { clearChannelThirdPartyEmotes } from "../stores/emotes.ts";
import * as emotes from "../services/emotes.ts";
import * as badges from "../services/badges.ts";

export function createSelectedChannelEffects(): void {
  let lastTitle: string | null = null;
  createEffect(() => {
    const ch = selectedChannel();
    const title = ch?.displayName ? `${ch.displayName} - Deatch` : "Deatch";
    if (title === lastTitle) return;
    lastTitle = title;
    getCurrentWindow()
      .setTitle(title)
      .catch(() => {});
  });

  createEffect(() => {
    const broadcaster = selectedChannel();
    sevenTv.setActive(broadcaster?.id ?? null);
    if (!broadcaster) {
      clearChannelThirdPartyEmotes();
      return;
    }
    badges.loadChannel(broadcaster.id);
    emotes.loadChannelThirdParty(broadcaster.id, broadcaster.login);
  });
}
