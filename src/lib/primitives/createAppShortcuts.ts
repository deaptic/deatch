import { onCleanup, onMount } from "solid-js";
import { shortcutManager } from "../managers/ShortcutManager.ts";
import { openPanel, setOpenPanel, togglePanel } from "../stores/ui.ts";
import {
  advancedAlwaysOnTop,
  setAdvancedAlwaysOnTop,
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
      shortcutManager.register("watch::resetFocus", watch.resetWatchFocus),
      shortcutManager.register("watch::muteOthers", watch.muteOtherWatched),
      shortcutManager.register(
        "watch::toggleMuteAll",
        watch.toggleMuteAllWatched,
      ),
      shortcutManager.register(
        "settings::toggle",
        () => togglePanel("settings"),
      ),
      shortcutManager.register("inbox::toggle", () => togglePanel("inbox")),
      shortcutManager.register("account::toggle", () => togglePanel("account")),
      shortcutManager.register(
        "emotePicker::toggle",
        () => togglePanel("emotePicker"),
      ),
      shortcutManager.register("panel::close", () => {
        if (!openPanel()) return false;
        setOpenPanel(null);
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
