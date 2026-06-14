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
  selectChannel: (ch: User) => void;
  toggleWatch: () => void;
  jumpToMessage: (channelId: string, messageId: string) => void;
  setLiveStreams: (streams: User[]) => void;
  setLiveLoaded: (loaded: boolean) => void;
};

export function createAppController(): AppController {
  const nav = createChannelNavigation();
  const subs = createChannelSubscriptions();
  const watch = createWatchControls(nav);

  createSelectedChannelEffects();
  createMentionsBadge();
  createSystemIntegration();
  createSessionLifecycle({
    setLiveLoaded: subs.setLiveLoaded,
    leaveAll: subs.leaveAll,
  });
  createAppShortcuts(nav, watch);

  return {
    selectChannel: nav.selectChannel,
    toggleWatch: watch.toggleWatch,
    jumpToMessage: nav.jumpToMessage,
    setLiveStreams: subs.setLiveStreams,
    setLiveLoaded: subs.setLiveLoaded,
  };
}
