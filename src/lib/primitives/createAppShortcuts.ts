import { onCleanup, onMount } from "solid-js";
import * as shortcuts from "../services/shortcuts.ts";
import * as readout from "../services/readout.ts";
import * as linkAudio from "../services/link.ts";
import { closeOverlay, openOverlay, toggleOverlay } from "../stores/ui.ts";
import { leavePage, showExplore, toggleSettings } from "../stores/view.ts";
import {
  advancedAlwaysOnTop,
  appearanceRailExpanded,
  appearanceZoom,
  linkAudioLink,
  resetAppearanceZoom,
  setAdvancedAlwaysOnTop,
  setAppearanceRailExpanded,
  setLinkAudioLink,
  stepAppearanceZoom,
  toggleFeedDensity,
} from "../stores/preferences.ts";
import { channelsInOrder } from "../stores/channels.ts";
import type { ChannelNavigation } from "./createChannelNavigation.ts";
import type { LinkControls } from "./createLinkControls.ts";

// The mouse's side buttons.
const MOUSE_HISTORY_STEPS: Record<number, 1 | -1> = { 3: -1, 4: 1 };

function zoom(change: () => void): void {
  change();
  readout.show(`${appearanceZoom()}%`);
}

export function createAppShortcuts(
  nav: ChannelNavigation,
  link: LinkControls,
): void {
  onMount(() => {
    const unbind = [
      shortcuts.register("channel::cycleNext", () => link.cycleChannel(1)),
      shortcuts.register("channel::cyclePrev", () => link.cycleChannel(-1)),
      shortcuts.register("channel::back", () => nav.stepHistory(-1)),
      shortcuts.register("channel::forward", () => nav.stepHistory(1)),
      shortcuts.register("link::toggle", link.toggleLink),
      shortcuts.register("link::toggleAudioLink", () =>
        setLinkAudioLink(!linkAudioLink()),
      ),
      shortcuts.register("link::toggleMute", linkAudio.toggleMute),
      shortcuts.register("link::muteOthers", linkAudio.muteOthers),
      shortcuts.register("link::toggleMuteAll", linkAudio.toggleMuteAll),
      shortcuts.register("link::closeTab", linkAudio.closeTab),
      shortcuts.register("link::openTab", linkAudio.openTab),
      shortcuts.register("settings::toggle", toggleSettings),
      shortcuts.register("explore::show", showExplore),
      shortcuts.register("rail::toggle", () =>
        setAppearanceRailExpanded(!appearanceRailExpanded()),
      ),
      shortcuts.register("inbox::toggle", () => toggleOverlay("inbox")),
      shortcuts.register("quickSwitch::toggle", () =>
        toggleOverlay("quickSwitch"),
      ),
      shortcuts.register("emotePicker::toggle", () =>
        toggleOverlay("emotePicker"),
      ),
      shortcuts.register("panel::close", () => {
        if (openOverlay()) {
          closeOverlay();
          return;
        }
        return leavePage();
      }),
      shortcuts.register("view::toggleAlwaysOnTop", () => {
        setAdvancedAlwaysOnTop(!advancedAlwaysOnTop());
      }),
      shortcuts.register("feed::toggleDensity", toggleFeedDensity),
      shortcuts.register("view::zoomIn", () =>
        zoom(() => stepAppearanceZoom(1)),
      ),
      shortcuts.register("view::zoomOut", () =>
        zoom(() => stepAppearanceZoom(-1)),
      ),
      shortcuts.register("view::zoomReset", () => zoom(resetAppearanceZoom)),
    ];
    for (let i = 1; i <= 9; i++) {
      const idx = i - 1;
      unbind.push(
        shortcuts.register(`channel::select${i}`, () => {
          const ordered = channelsInOrder();
          if (idx < ordered.length) nav.selectChannel(ordered[idx]);
        }),
      );
    }
    const onMouseUp = (e: MouseEvent) => {
      const delta = MOUSE_HISTORY_STEPS[e.button];
      if (!delta) return;
      e.preventDefault();
      nav.stepHistory(delta);
    };
    window.addEventListener("mouseup", onMouseUp);
    unbind.push(() => window.removeEventListener("mouseup", onMouseUp));
    onCleanup(() => {
      for (const u of unbind) u();
    });
  });
}
