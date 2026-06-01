import { batch } from "solid-js";
import type { ChannelNavigation } from "./createChannelNavigation.ts";
import { selectedChannel, channelsInOrder } from "../stores/channels.ts";
import {
  watchMode,
  watchedChannel,
  watchWarmedChannels,
  watchMutedByLogin,
  setWatchMode,
} from "../stores/watch.ts";
import { watchSetMuted } from "../api/watch.ts";

export type WatchControls = {
  cycleChannel(direction: 1 | -1): void;
  toggleWatch(): void;
  resetWatchFocus(): void;
  muteOtherWatched(): void;
  toggleMuteAllWatched(): void;
  toggleWatchMute(): void;
}

export function createWatchControls(nav: ChannelNavigation): WatchControls {
  function cycleChannel(direction: 1 | -1) {
    if (watchMode() !== null) {
      const watched = watchWarmedChannels();
      if (watched.length === 0) return;
      const i = watched.findIndex((c) => c?.id === selectedChannel()?.id);
      const nextIdx =
        i === -1
          ? direction === 1
            ? 0
            : watched.length - 1
          : (i + direction + watched.length) % watched.length;
      batch(() => {
        setWatchMode("manual");
        nav.applySelection(watched[nextIdx]);
      });
      return;
    }
    const ordered = channelsInOrder();
    if (ordered.length === 0) return;
    const i = ordered.findIndex((c) => c?.id === selectedChannel()?.id);
    const nextIdx =
      i === -1
        ? direction === 1
          ? 0
          : ordered.length - 1
        : (i + direction + ordered.length) % ordered.length;
    nav.selectChannel(ordered[nextIdx]);
  }

  function toggleWatch() {
    setWatchMode(watchMode() === null ? "auto" : null);
  }

  function resetWatchFocus() {
    if (watchMode() === "manual") setWatchMode("auto");
  }

  function muteOtherWatched() {
    const sel = selectedChannel();
    const watched = watchWarmedChannels();
    const focusedLogin =
      sel && watched.some((c) => c?.id === sel.id) ? sel.login : null;
    for (const ch of watched) {
      if (!ch?.login) continue;
      const shouldBeMuted = ch.login !== focusedLogin;
      const isMuted = watchMutedByLogin()[ch.login] === true;
      if (isMuted !== shouldBeMuted) void watchSetMuted(ch.login, shouldBeMuted);
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
    const target =
      watchMode() !== null
        ? watchMode() === "manual"
          ? selectedChannel()
          : watchedChannel()
        : (() => {
            const sel = selectedChannel();
            if (!sel) return null;
            return watchWarmedChannels().some((c) => c?.id === sel.id)
              ? sel
              : null;
          })();
    if (!target?.login) return;
    const muted = watchMutedByLogin()[target.login] === true;
    void watchSetMuted(target.login, !muted);
  }

  return {
    cycleChannel,
    toggleWatch,
    resetWatchFocus,
    muteOtherWatched,
    toggleMuteAllWatched,
    toggleWatchMute,
  };
}
