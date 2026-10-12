import { createEffect, on } from "solid-js";
import type { ChannelNavigation } from "./createChannelNavigation.ts";
import { channelsInOrder } from "../stores/channels.ts";
import {
  pendingChannel,
  selectedChannel,
  setWatchSynced,
  watchSynced,
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
  createEffect(
    on(watchedChannel, (wc) => {
      if (watchSynced() && wc) nav.selectChannel(wc);
    }, { defer: true }),
  );

  function cycleChannel(direction: 1 | -1) {
    // Synced walks only the browser's tabs; otherwise every channel, tabs first.
    const list = watchSynced()
      ? watchWarmedChannels()
      : [...watchWarmedChannels(), ...channelsInOrder()];
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

  // Turning on lands on the browser's current tab; turning off stays put.
  function toggleWatch() {
    if (watchSynced()) {
      setWatchSynced(false);
      return;
    }
    const target = watchedChannel() ?? watchWarmedChannels()[0];
    if (!target) return;
    setWatchSynced(true);
    nav.selectChannel(target);
  }

  return {
    cycleChannel,
    toggleWatch,
    muteOtherWatched,
    toggleMuteAllWatched,
    toggleWatchMute,
  };
}
