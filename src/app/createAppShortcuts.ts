import { onCleanup, onMount } from "solid-js";
import * as shortcuts from "../shared/keyboard/shortcuts.ts";
import * as flash from "../kit/flash.ts";
import * as link from "../features/link/index.ts";
import {
  closeOverlay,
  openOverlay,
  toggleOverlay,
  leavePage,
  showExplore,
  toggleSettings,
  type ChannelNavigation,
} from "../features/navigation/index.ts";
import {
  generalAlwaysOnTop,
  appearanceRailExpanded,
  appearanceZoom,
  linkAudioLink,
  resetAppearanceZoom,
  setGeneralAlwaysOnTop,
  setAppearanceRailExpanded,
  setLinkAudioLink,
  stepAppearanceZoom,
  toggleFeedDensity,
} from "../features/preferences/index.ts";
import { channelsInOrder } from "../features/channels/index.ts";
import type { LinkControls } from "../features/link/index.ts";
import { formatWholePercent } from "../shared/format/units.ts";

const MOUSE_HISTORY_STEPS: Record<number, 1 | -1> = { 3: -1, 4: 1 };

function zoom(change: () => void): void {
  change();
  flash.show(formatWholePercent(appearanceZoom()));
}

export function createAppShortcuts(
  nav: ChannelNavigation,
  controls: LinkControls,
): void {
  onMount(() => {
    const unbind = [
      shortcuts.register("channel::cycleNext", () => controls.cycleChannel(1)),
      shortcuts.register("channel::cyclePrev", () => controls.cycleChannel(-1)),
      shortcuts.register("channel::back", () => nav.stepHistory(-1)),
      shortcuts.register("channel::forward", () => nav.stepHistory(1)),
      shortcuts.register("link::toggle", controls.toggleLink),
      shortcuts.register("link::toggleAudioLink", () =>
        setLinkAudioLink(!linkAudioLink()),
      ),
      shortcuts.register("link::toggleMute", link.toggleMute),
      shortcuts.register("link::muteOthers", link.muteOthers),
      shortcuts.register("link::toggleMuteAll", link.toggleMuteAll),
      shortcuts.register("link::closeTab", () =>
        shortcuts.passUnless(link.closeTab()),
      ),
      shortcuts.register("link::openTab", link.openTab),
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
        return shortcuts.passUnless(leavePage());
      }),
      shortcuts.register("view::toggleAlwaysOnTop", () => {
        setGeneralAlwaysOnTop(!generalAlwaysOnTop());
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
          const channel = channelsInOrder()[idx];
          if (channel) nav.selectChannel(channel);
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
