import { createEffect, on } from "solid-js";
import type { ChannelNavigation } from "./createChannelNavigation.ts";
import { channelsInOrder } from "../stores/channels.ts";
import {
  pendingChannel,
  selectedChannel,
  setWatchMode,
  watchMode,
} from "../stores/view.ts";
import {
  watchedChannel,
  watchMutedByLogin,
  watchWarmedChannels,
} from "../stores/watch.ts";
import { watchSetMuted } from "../api/watch.ts";

export type WatchControls = {
  cycleChannel(direction: 1 | -1): void;
  toggleWatch(): void;
  muteOtherWatched(): void;
  toggleMuteAllWatched(): void;
  toggleWatchMute(): void;
};

export function createWatchControls(nav: ChannelNavigation): WatchControls {
  // In auto mode the app mirrors whichever channel the browser tab is on.
  createEffect(
    on(watchedChannel, (wc) => {
      if (watchMode() === "auto" && wc) nav.selectChannel(wc, "auto");
    }, { defer: true }),
  );

  createEffect(
    on(watchWarmedChannels, (warmed) => {
      if (watchMode() !== null) return;
      const sel = selectedChannel();
      if (sel && warmed.some((c) => c?.id === sel.id)) setWatchMode("manual");
    }, { defer: true }),
  );

  function cycleChannel(direction: 1 | -1) {
    // The Watch toggle decides which set alt+up/down walks.
    const list = watchMode() ? watchWarmedChannels() : channelsInOrder();
    if (list.length === 0) return;
    const i = list.findIndex((c) => c?.id === pendingChannel()?.id);
    const nextIdx = i === -1
      ? direction === 1 ? 0 : list.length - 1
      : (i + direction + list.length) % list.length;
    nav.selectChannel(list[nextIdx]);
  }

  function muteOtherWatched() {
    const sel = selectedChannel();
    const watched = watchWarmedChannels();
    const focusedLogin = sel && watched.some((c) => c?.id === sel.id)
      ? sel.login
      : null;
    for (const ch of watched) {
      if (!ch?.login) continue;
      const shouldBeMuted = ch.login !== focusedLogin;
      const isMuted = watchMutedByLogin()[ch.login] === true;
      if (isMuted !== shouldBeMuted) {
        void watchSetMuted(ch.login, shouldBeMuted);
      }
    }
  }

  function toggleMuteAllWatched() {
    const watched = watchWarmedChannels();
    if (watched.length === 0) return;
    const mutedMap = watchMutedByLogin();
    const anyUnmuted = watched.some(
      (ch) => ch?.login && mutedMap[ch.login] !== true,
    );
    for (const ch of watched) {
      if (!ch?.login) continue;
      const isMuted = mutedMap[ch.login] === true;
      if (isMuted !== anyUnmuted) void watchSetMuted(ch.login, anyUnmuted);
    }
  }

  function toggleWatchMute() {
    const sel = selectedChannel();
    const target = sel && watchWarmedChannels().some((c) => c?.id === sel.id)
      ? sel
      : null;
    if (!target?.login) return;
    const muted = watchMutedByLogin()[target.login] === true;
    void watchSetMuted(target.login, !muted);
  }

  function toggleWatch() {
    // Only auto turns off; null and manual both (re-)engage auto.
    const turningOn = watchMode() !== "auto";
    const list = turningOn ? watchWarmedChannels() : channelsInOrder();
    if (list.length === 0) {
      setWatchMode(turningOn ? "auto" : null);
      return;
    }
    // Jump focus into the new scope immediately. Turning on enters auto so we
    // follow the browser tab; turning off lands on a non-watched channel (null).
    if (turningOn) nav.selectChannel(watchedChannel() ?? list[0], "auto");
    else nav.selectChannel(list[0], null);
  }

  return {
    cycleChannel,
    toggleWatch,
    muteOtherWatched,
    toggleMuteAllWatched,
    toggleWatchMute,
  };
}
