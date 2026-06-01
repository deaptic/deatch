import type { Accessor } from "solid-js";
import type { User } from "../types/twitch/user.ts";
import { createChannelNavigation } from "./createChannelNavigation.ts";
import { createWatchControls } from "./createWatchControls.ts";
import { createChannelSubscriptions } from "./createChannelSubscriptions.ts";
import { createSelectedChannelEffects } from "./createSelectedChannelEffects.ts";
import { createMentionsBadge } from "./createMentionsBadge.ts";
import { createSystemIntegration } from "./createSystemIntegration.ts";
import { createSessionLifecycle } from "./createSessionLifecycle.ts";
import { createAppShortcuts } from "./createAppShortcuts.ts";

export type AppController = {
  renderedChannels: Accessor<User[]>;
  selectChannel: (ch: User, fromWatched?: boolean) => void;
  jumpToMessage: (channelId: string, messageId: string) => void;
  setLiveStreams: (streams: User[]) => void;
  setLiveLoaded: (loaded: boolean) => void;
}

export function createAppController(): AppController {
  const nav = createChannelNavigation();
  const subs = createChannelSubscriptions();
  const watch = createWatchControls(nav);

  createSelectedChannelEffects();
  createMentionsBadge();
  createSystemIntegration();
  createSessionLifecycle({
    selectChannel: nav.selectChannel,
    setLiveLoaded: subs.setLiveLoaded,
    leaveAll: subs.leaveAll,
  });
  createAppShortcuts(nav, watch);

  return {
    renderedChannels: subs.renderedChannels,
    selectChannel: nav.selectChannel,
    jumpToMessage: nav.jumpToMessage,
    setLiveStreams: subs.setLiveStreams,
    setLiveLoaded: subs.setLiveLoaded,
  };
}
