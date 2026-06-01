import { batch, createEffect } from "solid-js";
import type { User } from "../types/twitch/user";
import {
  selectedChannel,
  setSelectedChannel,
  usersById,
  rememberUser,
} from "../stores/channels";
import {
  watchMode,
  watchedChannel,
  watchWarmedChannels,
  setWatchMode,
} from "../stores/watch";
import { snapshotDivider, ensureFeed, markSeen } from "../stores/feeds";
import { markChannelMentionsRead } from "../stores/inbox";
import { scrollToMessage } from "../services/feeds";

export type ChannelNavigation = {
  applySelection(ch: User): void;
  selectChannel(ch: User, fromWatched?: boolean): void;
  jumpToMessage(channelId: string, messageId: string): void;
}

export function createChannelNavigation(): ChannelNavigation {
  function applySelection(ch: User) {
    const prev = selectedChannel();
    if (prev && prev.id !== ch.id) snapshotDivider(prev.id);
    rememberUser(ch);
    setSelectedChannel(ch);
    ensureFeed(ch.id);
    markSeen(ch.id);
    markChannelMentionsRead(ch.id);
  }

  function selectChannel(ch: User, fromWatched = false) {
    batch(() => {
      setWatchMode(fromWatched ? "manual" : null);
      applySelection(ch);
    });
  }

  function jumpToMessage(channelId: string, messageId: string) {
    const ch = usersById.get(channelId);
    const needsSwitch = !!ch && selectedChannel()?.id !== channelId;
    if (needsSwitch && ch) selectChannel(ch);
    if (needsSwitch) setTimeout(() => scrollToMessage(messageId), 100);
    else scrollToMessage(messageId);
  }

  createEffect(() => {
    if (watchMode() !== "auto") return;
    const ch = watchedChannel();
    if (!ch) {
      if (selectedChannel() !== null) setSelectedChannel(null);
      return;
    }
    if (selectedChannel()?.id === ch.id) return;
    applySelection(ch);
  });

  createEffect(() => {
    if (watchMode() !== "manual") return;
    const sel = selectedChannel();
    if (sel && !watchWarmedChannels().some((c) => c?.id === sel.id)) {
      setWatchMode("auto");
    }
  });

  return { applySelection, selectChannel, jumpToMessage };
}
