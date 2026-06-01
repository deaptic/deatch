import type { Accessor } from "solid-js";
import type { User } from "../types/twitch/user";
import { createChannelNavigation } from "./createChannelNavigation";
import { createWatchControls } from "./createWatchControls";
import { createChannelSubscriptions } from "./createChannelSubscriptions";
import { createSelectedChannelEffects } from "./createSelectedChannelEffects";
import { createMentionsBadge } from "./createMentionsBadge";
import { createSystemIntegration } from "./createSystemIntegration";
import { createSessionLifecycle } from "./createSessionLifecycle";
import { createAppShortcuts } from "./createAppShortcuts";

export interface AppController {
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
