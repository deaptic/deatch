import { createEffect, on } from "solid-js";
import type { User } from "../types/index.ts";
import { addToast } from "../../kit/toasts.ts";
import * as users from "../services/users.ts";
import {
  stepVisits,
  linkSynced,
  recordVisit,
  selectedChannel,
  setJumpTarget,
  setLinkSynced,
  setSelectedChannel,
} from "../stores/view.ts";
import { linkWarmedChannels } from "../stores/link.ts";
import { rememberChannel } from "../stores/preferences.ts";
import { linkFocus } from "../../platform/link.ts";
import { reportFailure } from "../../platform/invoke.ts";
import { ensureFeed } from "../stores/feeds.ts";
import * as inbox from "../services/inbox.ts";
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
