import { openUrl } from "@tauri-apps/plugin-opener";
import type { UserRef } from "../../lib/types/index.ts";
import {
  onMiddleClick,
  preventAutoscroll,
} from "../../lib/utils/middleClick.ts";
import { channelUrl } from "../../lib/utils/twitchUrl.ts";
import { openMenuAt } from "../../lib/utils/contextMenu.ts";

export type UserAction = (
  x: number,
  y: number,
  identity: Partial<UserRef>,
) => void;

export type UserActions = {
  onShowUserCard?: UserAction;
  onUserContextMenu?: UserAction;
};

/// The one way a user responds to the mouse: left opens their card, right
/// their menu, middle their channel in the browser.
export function userLink(
  identity: () => Partial<UserRef> & { login: string },
  actions: UserActions,
) {
  return {
    onClick: (e: MouseEvent) => {
      if (!actions.onShowUserCard) return;
      e.stopPropagation();
      actions.onShowUserCard(e.clientX, e.clientY, identity());
    },
    onContextMenu: (e: MouseEvent) =>
      openMenuAt(
        e,
        actions.onUserContextMenu &&
          ((x, y) => actions.onUserContextMenu!(x, y, identity())),
      ),
    onAuxClick: onMiddleClick(() => openUrl(channelUrl(identity().login))),
    onMouseDown: preventAutoscroll,
  };
}

export const userLinkHover = (actions: UserActions) =>
  actions.onShowUserCard ? "cursor-pointer hover:underline" : "";
