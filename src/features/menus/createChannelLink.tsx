import { Show } from "solid-js";
import * as browser from "../../platform/browser.ts";
import type { User } from "../../shared/types/index.ts";
import { onMiddleClick, preventAutoscroll } from "../../kit/middleClick.ts";
import { openMenuAt } from "../../kit/contextMenu.ts";
import { onActivateKey } from "../../kit/keyActivation.ts";
import { createPopover } from "../../kit/createPopover.ts";
import ChannelContextMenu from "./ChannelContextMenu.tsx";

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
export type ChannelLink = ReturnType<typeof createChannelLink>;
