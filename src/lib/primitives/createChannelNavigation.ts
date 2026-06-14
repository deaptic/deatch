import { createEffect, on } from "solid-js";
import type { User } from "../types/twitch/user.ts";
import { rememberUser, usersById } from "../stores/channels.ts";
import {
  selectedChannel,
  setSelectedChannel,
  setWatchMode,
  type WatchMode,
} from "../stores/view.ts";
import { watchWarmedChannels } from "../stores/watch.ts";
import { ensureFeed, markSeen } from "../stores/feeds.ts";
import { markChannelMentionsRead } from "../stores/inbox.ts";
import { scrollToMessage } from "../services/feeds.ts";

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

  function jumpToMessage(channelId: string, messageId: string) {
    const ch = usersById.get(channelId);
    const needsSwitch = !!ch && selectedChannel()?.id !== channelId;
    if (needsSwitch && ch) selectChannel(ch);
    if (needsSwitch) setTimeout(() => scrollToMessage(messageId), 100);
    else scrollToMessage(messageId);
  }

  // Whatever channel is shown — picked manually or mirrored from the browser
  // tab in Watch mode — gets its feed prepared and marked seen.
  createEffect(
    on(selectedChannel, (ch) => {
      if (!ch) return;
      rememberUser(ch);
      ensureFeed(ch.id);
      markSeen(ch.id);
      markChannelMentionsRead(ch.id);
    }),
  );

  return { selectChannel, jumpToMessage };
}
