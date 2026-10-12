import { createEffect, on } from "solid-js";
import type { ChannelNavigation } from "./createChannelNavigation.ts";
import { channelsInOrder } from "../stores/channels.ts";
import {
  linkSynced,
  pendingChannel,
  selectedChannel,
  setLinkSynced,
} from "../stores/view.ts";
import {
  linkedChannel,
  linkMutedByLogin,
  linkWarmedChannels,
} from "../stores/link.ts";
import { linkSetMuted } from "../api/link.ts";

export type LinkControls = {
  cycleChannel(direction: 1 | -1): void;
  toggleLink(): void;
  muteOtherLinked(): void;
  toggleMuteAllLinked(): void;
  toggleLinkMute(): void;
};

export function createLinkControls(nav: ChannelNavigation): LinkControls {
  createEffect(
    on(linkedChannel, (wc) => {
      if (linkSynced() && wc) nav.selectChannel(wc);
    }, { defer: true }),
  );

  function cycleChannel(direction: 1 | -1) {
    // Synced walks only the browser's tabs; otherwise every channel, tabs first.
    const list = linkSynced()
      ? linkWarmedChannels()
      : [...linkWarmedChannels(), ...channelsInOrder()];
    if (list.length === 0) return;
    const i = list.findIndex((c) => c?.id === pendingChannel()?.id);
    const nextIdx = i === -1
      ? direction === 1 ? 0 : list.length - 1
      : (i + direction + list.length) % list.length;
    nav.selectChannel(list[nextIdx]);
  }

  function muteOtherLinked() {
    const sel = selectedChannel();
    const linked = linkWarmedChannels();
    const focusedLogin = sel && linked.some((c) => c?.id === sel.id)
      ? sel.login
      : null;
    for (const ch of linked) {
      if (!ch?.login) continue;
      const shouldBeMuted = ch.login !== focusedLogin;
      const isMuted = linkMutedByLogin()[ch.login] === true;
      if (isMuted !== shouldBeMuted) {
        void linkSetMuted(ch.login, shouldBeMuted);
      }
    }
  }

  function toggleMuteAllLinked() {
    const linked = linkWarmedChannels();
    if (linked.length === 0) return;
    const mutedMap = linkMutedByLogin();
    const anyUnmuted = linked.some(
      (ch) => ch?.login && mutedMap[ch.login] !== true,
    );
    for (const ch of linked) {
      if (!ch?.login) continue;
      const isMuted = mutedMap[ch.login] === true;
      if (isMuted !== anyUnmuted) void linkSetMuted(ch.login, anyUnmuted);
    }
  }

  function toggleLinkMute() {
    const sel = selectedChannel();
    const target = sel && linkWarmedChannels().some((c) => c?.id === sel.id)
      ? sel
      : null;
    if (!target?.login) return;
    const muted = linkMutedByLogin()[target.login] === true;
    void linkSetMuted(target.login, !muted);
  }

  // Turning on lands on the browser's current tab; turning off stays put.
  function toggleLink() {
    if (linkSynced()) {
      setLinkSynced(false);
      return;
    }
    const target = linkedChannel() ?? linkWarmedChannels()[0];
    if (!target) return;
    setLinkSynced(true);
    nav.selectChannel(target);
  }

  return {
    cycleChannel,
    toggleLink,
    muteOtherLinked,
    toggleMuteAllLinked,
    toggleLinkMute,
  };
}
