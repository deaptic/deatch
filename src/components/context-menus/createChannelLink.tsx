import { Show } from "solid-js";
import * as browser from "../../lib/services/browser.ts";
import type { User } from "../../lib/types/index.ts";
import {
  onMiddleClick,
  preventAutoscroll,
} from "../../lib/utils/middleClick.ts";
import { openMenuAt } from "../../lib/utils/contextMenu.ts";
import { onActivateKey } from "../ui/keyActivation.ts";
import { createPopover } from "../ui/createPopover.ts";
import ChannelContextMenu from "./ChannelContextMenu.tsx";

/// The one way a channel responds to the mouse: left opens its chat, right
/// its channel menu, middle the channel in the browser. Spread `handlers` on
/// the element and render `menu()` beside it.
export function createChannelLink(
  channel: () => User | undefined,
  onOpen?: () => void,
) {
  const popover = createPopover<{ ch: User }>();

  const handlers = {
    ...(onOpen && {
      role: "button" as const,
      tabIndex: 0,
      onKeyDown: onActivateKey(() => onOpen()),
    }),
    onClick: (e: MouseEvent) => {
      if (!onOpen) return;
      e.stopPropagation();
      onOpen();
    },
    onContextMenu: (e: MouseEvent) => {
      const ch = channel();
      openMenuAt(e, ch && ((x, y) => popover.open(x, y, { ch })));
    },
    onAuxClick: onMiddleClick(() => {
      const ch = channel();
      if (ch) browser.openChannel(ch.login);
    }),
    onMouseDown: preventAutoscroll,
  };

  const menu = () => (
    <Show when={popover.state()}>
      {(m) => (
        <ChannelContextMenu
          x={m().x}
          y={m().y}
          ch={m().ch}
          place="link"
          onOpen={onOpen}
          onClose={popover.close}
        />
      )}
    </Show>
  );

  return { handlers, menu, cursor: onOpen ? "cursor-pointer" : "" };
}
