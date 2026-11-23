import { activeTab, tabs } from "./store.ts";
import { createEffect, on } from "solid-js";
import type { ChannelNavigation } from "../../lib/primitives/createChannelNavigation.ts";
import { channelsInOrder } from "../../lib/stores/channels.ts";
import {
  linkSynced,
  pendingChannel,
  selectedChannel,
  setLinkSynced,
} from "../../lib/stores/view.ts";
import {
  compressorSettings,
  linkAudioLink,
  linkChannelGains,
  linkCompressor,
} from "../../lib/stores/preferences.ts";
import * as link from "./store.ts";
import { at } from "../../lib/utils/at.ts";
import { wrapIndex } from "../../shared/solid/createListNavigation.ts";

export type LinkControls = {
  cycleChannel: (direction: 1 | -1) => void;
  toggleLink: () => void;
};

export function createLinkControls(nav: ChannelNavigation): LinkControls {
  createEffect(
    on(
      activeTab,
      (wc) => {
        if (linkSynced() && wc) nav.selectChannel(wc);
      },
      { defer: true },
    ),
  );

  createEffect(() =>
    link.sendAudio(linkCompressor(), compressorSettings(), linkChannelGains()),
  );

  createEffect(
    on(
      [selectedChannel, linkSynced, linkAudioLink],
      () => {
        if (linkSynced() && linkAudioLink() && link.selectedTab()) {
          link.muteOthersSilently();
        }
      },
      { defer: true },
    ),
  );

  function cycleChannel(direction: 1 | -1) {
    const list = linkSynced() ? tabs() : [...tabs(), ...channelsInOrder()];
    if (list.length === 0) return;
    const i = list.findIndex((c) => c.id === pendingChannel()?.id);
    const nextIdx =
      i === -1
        ? direction === 1
          ? 0
          : list.length - 1
        : wrapIndex(i, direction, list.length);
    nav.selectChannel(at(list, nextIdx));
  }

  function toggleLink() {
    if (linkSynced()) {
      setLinkSynced(false);
      return;
    }
    const target = link.selectedTab() ?? activeTab() ?? tabs()[0];
    if (!target) return;
    setLinkSynced(true);
    nav.selectChannel(target);
  }

  return { cycleChannel, toggleLink };
}
