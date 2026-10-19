import { createEffect, on } from "solid-js";
import type { ChannelNavigation } from "./createChannelNavigation.ts";
import { channelsInOrder } from "../stores/channels.ts";
import {
  linkSynced,
  pendingChannel,
  selectedChannel,
  setLinkSynced,
} from "../stores/view.ts";
import { linkedChannel, linkWarmedChannels } from "../stores/link.ts";
import { linkAudioLink } from "../stores/preferences.ts";
import * as link from "../services/link.ts";

export type LinkControls = {
  cycleChannel(direction: 1 | -1): void;
  toggleLink(): void;
};

export function createLinkControls(nav: ChannelNavigation): LinkControls {
  createEffect(
    on(linkedChannel, (wc) => {
      if (linkSynced() && wc) nav.selectChannel(wc);
    }, { defer: true }),
  );

  // With audio linked while synced, only the shown tab plays.
  createEffect(
    on([selectedChannel, linkSynced, linkAudioLink], () => {
      if (linkSynced() && linkAudioLink() && link.selectedLinked()) {
        link.muteOthers();
      }
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

  // Turning on keeps the open channel when it has a tab, and the browser
  // follows; otherwise it lands on the browser's current tab. Off stays put.
  function toggleLink() {
    if (linkSynced()) {
      setLinkSynced(false);
      return;
    }
    const target = link.selectedLinked() ?? linkedChannel() ??
      linkWarmedChannels()[0];
    if (!target) return;
    setLinkSynced(true);
    nav.selectChannel(target);
  }

  return { cycleChannel, toggleLink };
}
