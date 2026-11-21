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
import {
  compressorSettings,
  linkAudioLink,
  linkChannelGains,
  linkCompressor,
} from "../stores/preferences.ts";
import * as link from "../services/link.ts";
import { at } from "../utils/at.ts";
import { wrapIndex } from "../reactive/createListNavigation.ts";

export type LinkControls = {
  cycleChannel: (direction: 1 | -1) => void;
  toggleLink: () => void;
};

export function createLinkControls(nav: ChannelNavigation): LinkControls {
  createEffect(
    on(
      linkedChannel,
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
        if (linkSynced() && linkAudioLink() && link.selectedLinked()) {
          link.muteOthersSilently();
        }
      },
      { defer: true },
    ),
  );

  function cycleChannel(direction: 1 | -1) {
    const list = linkSynced()
      ? linkWarmedChannels()
      : [...linkWarmedChannels(), ...channelsInOrder()];
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
    const target =
      link.selectedLinked() ?? linkedChannel() ?? linkWarmedChannels()[0];
    if (!target) return;
    setLinkSynced(true);
    nav.selectChannel(target);
  }

  return { cycleChannel, toggleLink };
}
