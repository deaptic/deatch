import { createEffect, on } from "solid-js";
import type { User } from "../types/index.ts";
import { knownUser } from "../stores/users.ts";
import * as users from "../services/users.ts";
import {
  linkSynced,
  selectedChannel,
  setJumpTarget,
  setLinkSynced,
  setSelectedChannel,
} from "../stores/view.ts";
import { linkWarmedChannels } from "../stores/link.ts";
import { linkFocus } from "../api/link.ts";
import { ensureFeed, markSeen } from "../stores/feeds.ts";
import { markChannelMentionsRead } from "../stores/inbox.ts";

export type ChannelNavigation = {
  selectChannel(ch: User): void;
  jumpToMessage(channelId: string, messageId: string): void;
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

  // The feed scrolls once it holds the message, so this works whether the
  // channel is already open or still has to mount and load its backlog.
  function jumpToMessage(channelId: string, messageId: string) {
    const ch = knownUser(channelId);
    if (!ch) return;
    setJumpTarget({ channelId, messageId });
    if (selectedChannel()?.id !== channelId) selectChannel(ch);
  }

  // Whatever channel is shown — picked manually or mirrored from the browser
  // tab in Link mode — gets its feed prepared and marked seen.
  createEffect(
    on(selectedChannel, (ch) => {
      if (!ch) return;
      users.set([ch]);
      ensureFeed(ch.id);
      markSeen(ch.id);
      markChannelMentionsRead(ch.id);
    }),
  );

  return { selectChannel, jumpToMessage };
}
