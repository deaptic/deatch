import { onCleanup, onMount } from "solid-js";
import * as shortcuts from "../../shared/keyboard/shortcuts.ts";
import * as clipboard from "../../kit/clipboard.ts";
import { clearDivider, type FeedApi, textOf } from "../feed/index.ts";
import type { FeedMessage } from "../../shared/types/index.ts";

type Deps = {
  broadcasterId: () => string;
  feed: () => FeedApi | null;
  reply: (msg: FeedMessage) => void;
  focusInput: () => void;
};

export function createFeedShortcuts(deps: Deps): void {
  const withSelected = (fn: (msg: FeedMessage) => void) => () => {
    const m = deps.feed()?.getSelectedMessage();
    if (!m) return shortcuts.PASS;
    fn(m);
  };
  const move = (direction: 1 | -1) => () => {
    deps.feed()?.moveSelection(direction);
  };

  onMount(() => {
    const stops = [
      shortcuts.registerLocal("escape", () => {
        clearDivider(deps.broadcasterId());
        return shortcuts.PASS;
      }),
      shortcuts.register("feed::selectPrev", move(-1)),
      shortcuts.register("feed::selectNext", move(1)),
      shortcuts.registerLocal("up", move(-1), "feedSelected"),
      shortcuts.registerLocal("down", move(1), "feedSelected"),
      shortcuts.registerLocal(
        "escape",
        () => {
          deps.feed()?.clearSelection();
          deps.focusInput();
        },
        "feedSelected",
      ),
      shortcuts.registerLocal(
        "enter",
        withSelected(deps.reply),
        "feedSelected",
      ),
      shortcuts.register(
        "feed::reply",
        withSelected(deps.reply),
        "feedSelected",
      ),
      shortcuts.register(
        "feed::copy",
        withSelected((m) => clipboard.copy(textOf(m))),
        "feedSelected",
      ),
    ];
    onCleanup(() => {
      for (const stop of stops) stop();
    });
  });
}
