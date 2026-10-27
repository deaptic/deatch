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
import { ensureFeed, markSeen } from "../stores/feeds.ts";
import { markChannelMentionsRead } from "../stores/inbox.ts";
import { t } from "../i18n/index.ts";

export type ChannelNavigation = {
  selectChannel(ch: User): void;
  openChannel(channelId: string): void;
  jumpToMessage(channelId: string, messageId: string): void;
  stepHistory(delta: 1 | -1): void;
};

export function createChannelNavigation(): ChannelNavigation {
  // While synced the browser follows along; leaving the linked tabs ends it.
  function selectChannel(ch: User) {
    if (linkSynced()) {
      const linked = linkWarmedChannels().some((c) => c?.id === ch.id);
      if (linked) void linkFocus(ch.login);
      else setLinkSynced(false);
    }
    setSelectedChannel(ch);
  }

  function openChannel(channelId: string, then?: () => void) {
    users.get([channelId])
      .then(([ch]) => {
        if (!ch) {
          return addToast(t("COMMON_CHANNEL_NOT_FOUND"), "error");
        }
        then?.();
        if (selectedChannel()?.id !== channelId) selectChannel(ch);
      })
      .catch((e) => console.warn("channel lookup failed", e));
  }

  // The feed scrolls once it holds the message, so this works whether the
  // channel is already open or still has to mount and load its backlog.
  function jumpToMessage(channelId: string, messageId: string) {
    openChannel(channelId, () => setJumpTarget({ channelId, messageId }));
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
      users.set([ch]);
      ensureFeed(ch.id);
      markSeen(ch.id);
      markChannelMentionsRead(ch.id);
    }),
  );

  return {
    selectChannel,
    openChannel: (channelId) => openChannel(channelId),
    jumpToMessage,
    stepHistory,
  };
}
