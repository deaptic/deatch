import { createEffect, on } from "solid-js";
import type { User } from "../types/index.ts";
import { knownUser } from "../stores/users.ts";
import * as users from "../services/users.ts";
import {
  selectedChannel,
  setJumpTarget,
  setSelectedChannel,
  setWatchMode,
  type WatchMode,
} from "../stores/view.ts";
import { watchWarmedChannels } from "../stores/watch.ts";
import { ensureFeed, markSeen } from "../stores/feeds.ts";
import { markChannelMentionsRead } from "../stores/inbox.ts";

export type ChannelNavigation = {
  selectChannel(ch: User, mode?: WatchMode): void;
  jumpToMessage(channelId: string, messageId: string): void;
};

export function createChannelNavigation(): ChannelNavigation {
  function selectChannel(ch: User, mode?: WatchMode) {
    const watched = watchWarmedChannels().some((c) => c?.id === ch.id);
    setWatchMode(mode !== undefined ? mode : watched ? "manual" : null);
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
  // tab in Watch mode — gets its feed prepared and marked seen.
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
