import { onCleanup, onMount } from "solid-js";
import * as shortcuts from "../services/shortcuts.ts";
import { closeOverlay, openOverlay, toggleOverlay } from "../stores/ui.ts";
import { leavePage, showExplore, toggleSettings } from "../stores/view.ts";
import {
  advancedAlwaysOnTop,
  appearanceRailExpanded,
  setAdvancedAlwaysOnTop,
  setAppearanceRailExpanded,
} from "../stores/preferences.ts";
import { channelsInOrder } from "../stores/channels.ts";
import type { ChannelNavigation } from "./createChannelNavigation.ts";
import type { WatchControls } from "./createWatchControls.ts";

export function createAppShortcuts(
  nav: ChannelNavigation,
  watch: WatchControls,
): void {
  onMount(() => {
    const unbind = [
      shortcuts.register(
        "channel::cycleNext",
        () => watch.cycleChannel(1),
      ),
      shortcuts.register(
        "channel::cyclePrev",
        () => watch.cycleChannel(-1),
      ),
      shortcuts.register("watch::toggle", watch.toggleWatch),
      shortcuts.register("watch::toggleMute", watch.toggleWatchMute),
      shortcuts.register("watch::muteOthers", watch.muteOtherWatched),
      shortcuts.register(
        "watch::toggleMuteAll",
        watch.toggleMuteAllWatched,
      ),
      shortcuts.register("settings::toggle", toggleSettings),
      shortcuts.register("explore::show", showExplore),
      shortcuts.register(
        "rail::toggle",
        () => setAppearanceRailExpanded(!appearanceRailExpanded()),
      ),
      shortcuts.register("inbox::toggle", () => toggleOverlay("inbox")),
      shortcuts.register(
        "quickSwitch::toggle",
        () => toggleOverlay("quickSwitch"),
      ),
      shortcuts.register(
        "emotePicker::toggle",
        () => toggleOverlay("emotePicker"),
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
    onCleanup(() => {
      for (const u of unbind) u();
    });
  });
}
