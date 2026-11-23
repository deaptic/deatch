import { createEffect, on } from "solid-js";
import type { User } from "../../shared/types/index.ts";
import { addToast } from "../../kit/toasts.ts";
import { users } from "../users/index.ts";
import {
  stepVisits,
  linkSynced,
  recordVisit,
  selectedChannel,
  setJumpTarget,
  setLinkSynced,
  setSelectedChannel,
} from "./store.ts";
import * as link from "../link/index.ts";
import { rememberChannel } from "../preferences/index.ts";
import { linkFocus } from "../../platform/link.ts";
import { reportFailure } from "../../platform/invoke.ts";
import { ensureFeed } from "../feed/index.ts";
import * as inbox from "../inbox/index.ts";
import { t } from "../../shared/i18n/index.ts";

export type ChannelNavigation = {
  selectChannel: (ch: User) => void;
  openChannel: (broadcasterId: string) => void;
  jumpToMessage: (broadcasterId: string, messageId: string) => void;
  stepHistory: (delta: 1 | -1) => void;
};

export function createChannelNavigation(): ChannelNavigation {
  function selectChannel(ch: User) {
    if (linkSynced()) {
      const linked = link.tabs().some((c) => c.id === ch.id);
      if (linked) {
        linkFocus({ channel: ch.login }, { silent: true }).catch(() => {});
      } else {
        setLinkSynced(false);
      }
    }
    setSelectedChannel(ch);
  }

  function openChannel(broadcasterId: string, then?: () => void) {
    users.get([broadcasterId]).then(
      ([ch]) => {
        if (!ch) {
          return addToast(t("ERROR_CHANNEL_NOT_FOUND_ERROR"), "error");
        }
        then?.();
        if (selectedChannel()?.id !== broadcasterId) selectChannel(ch);
      },
      (e: unknown) => {
        reportFailure(e);
      },
    );
  }

  function jumpToMessage(broadcasterId: string, messageId: string) {
    openChannel(broadcasterId, () =>
      setJumpTarget({ broadcasterId, messageId }),
    );
  }

  function stepHistory(delta: 1 | -1) {
    const ch = stepVisits(delta);
    if (ch) selectChannel(ch);
  }

  createEffect(
    on(selectedChannel, (ch) => {
      if (!ch) return;
      recordVisit(ch);
      rememberChannel(ch.id);
      users.note([ch]);
      ensureFeed(ch.id);
      inbox.markChannelSeen(ch.id);
    }),
  );

  return {
    selectChannel,
    openChannel: (broadcasterId) => openChannel(broadcasterId),
    jumpToMessage,
    stepHistory,
  };
}
