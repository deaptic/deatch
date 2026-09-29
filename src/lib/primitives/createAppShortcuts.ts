import { onCleanup, onMount } from "solid-js";
import { shortcutManager } from "../managers/ShortcutManager.ts";
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
      shortcutManager.register(
        "channel::cycleNext",
        () => watch.cycleChannel(1),
      ),
      shortcutManager.register(
        "channel::cyclePrev",
        () => watch.cycleChannel(-1),
      ),
      shortcutManager.register("watch::toggle", watch.toggleWatch),
      shortcutManager.register("watch::toggleMute", watch.toggleWatchMute),
      shortcutManager.register("watch::muteOthers", watch.muteOtherWatched),
      shortcutManager.register(
        "watch::toggleMuteAll",
        watch.toggleMuteAllWatched,
      ),
      shortcutManager.register("settings::toggle", toggleSettings),
      shortcutManager.register("explore::show", showExplore),
      shortcutManager.register(
        "rail::toggle",
        () => setAppearanceRailExpanded(!appearanceRailExpanded()),
      ),
      shortcutManager.register("inbox::toggle", () => toggleOverlay("inbox")),
      shortcutManager.register(
        "quickSwitch::toggle",
        () => toggleOverlay("quickSwitch"),
      ),
      shortcutManager.register(
        "emotePicker::toggle",
        () => toggleOverlay("emotePicker"),
      ),
      shortcutManager.register("panel::close", () => {
        if (openOverlay()) {
          closeOverlay();
          return;
        }
        return leavePage();
      }),
      shortcutManager.register("view::toggleAlwaysOnTop", () => {
        setAdvancedAlwaysOnTop(!advancedAlwaysOnTop());
      }),
    ];
    for (let i = 1; i <= 9; i++) {
      const idx = i - 1;
      unbind.push(
        shortcutManager.register(`channel::select${i}`, () => {
          const ordered = channelsInOrder();
          if (idx < ordered.length) nav.selectChannel(ordered[idx]);
        }),
      );
    }
    shortcutManager.start();
    onCleanup(() => {
      for (const u of unbind) u();
      shortcutManager.stop();
    });
  });
}
