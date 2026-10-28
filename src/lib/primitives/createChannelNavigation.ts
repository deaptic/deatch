import { createEffect, on } from "solid-js";
import type { User } from "../types/index.ts";
import { addToast } from "../stores/toasts.ts";
import * as users from "../services/users.ts";
import {
  historyStep,
  linkSynced,
  recordVisit,
  selectedChannel,
  setJumpTarget,
  setLinkSynced,
  setSelectedChannel,
} from "../stores/view.ts";
import { linkWarmedChannels } from "../stores/link.ts";
import { linkFocus } from "../api/link.ts";
import { reportFailure } from "../api/utils.ts";
import { ensureFeed, markSeen } from "../stores/feeds.ts";
import * as inbox from "../services/inbox.ts";
import { t } from "../i18n/index.ts";

export type ChannelNavigation = {
  selectChannel: (ch: User) => void;
  openChannel: (broadcasterId: string) => void;
  jumpToMessage: (
    broadcasterId: string,
    messageId: string,
    timestamp: number | null,
  ) => void;
  stepHistory: (delta: 1 | -1) => void;
};

export function createChannelNavigation(): ChannelNavigation {
  // While synced the browser follows along; leaving the linked tabs ends it.
  function selectChannel(ch: User) {
    if (linkSynced()) {
      const linked = linkWarmedChannels().some((c) => c.id === ch.id);
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
          return addToast(t("CHANNEL_NOT_FOUND"), "error");
        }
        then?.();
        if (selectedChannel()?.id !== broadcasterId) selectChannel(ch);
      },
      (e: unknown) => {
        reportFailure(e);
      },
    );
  }

  // The feed scrolls once it holds the message, so this works whether the
  // channel is already open or still has to mount and load its backlog.
  function jumpToMessage(
    broadcasterId: string,
    messageId: string,
    timestamp: number | null,
  ) {
    openChannel(broadcasterId, () =>
      setJumpTarget({ broadcasterId, messageId, timestamp }),
    );
  }

  function stepHistory(delta: 1 | -1) {
    const ch = historyStep(delta);
    if (ch) selectChannel(ch);
  }

  // Whatever channel is shown — picked manually or mirrored from the browser
  // tab in Link mode — gets its feed prepared and marked seen.
  createEffect(
    on(selectedChannel, (ch) => {
      if (!ch) return;
      recordVisit(ch);
      users.note([ch]);
      ensureFeed(ch.id);
      markSeen(ch.id);
      inbox.markChannelRead(ch.id);
    }),
  );

  return {
    selectChannel,
    openChannel: (broadcasterId) => openChannel(broadcasterId),
    jumpToMessage,
    stepHistory,
  };
}
