import type { User } from "../types/index.ts";
import { createChannelNavigation } from "./createChannelNavigation.ts";
import { createLinkControls } from "./createLinkControls.ts";
import { createChannelSubscriptions } from "./createChannelSubscriptions.ts";
import { createSelectedChannelEffects } from "./createSelectedChannelEffects.ts";
import { createMentionsBadge } from "./createMentionsBadge.ts";
import { createSystemIntegration } from "./createSystemIntegration.ts";
import { createSessionLifecycle } from "./createSessionLifecycle.ts";
import { createAppShortcuts } from "./createAppShortcuts.ts";
import { createServices } from "./createServices.ts";

export type AppController = {
  selectChannel: (ch: User) => void;
  toggleLink: () => void;
  openChannel: (channelId: string) => void;
  jumpToMessage: (channelId: string, messageId: string) => void;
};

export function createAppController(): AppController {
  createServices();
  const nav = createChannelNavigation();
  const subs = createChannelSubscriptions();
  const link = createLinkControls(nav);

  createSelectedChannelEffects();
  createMentionsBadge();
  createSystemIntegration();
  createSessionLifecycle({ leaveAll: subs.leaveAll });
  createAppShortcuts(nav, link);

  return {
    selectChannel: nav.selectChannel,
    toggleLink: link.toggleLink,
    openChannel: nav.openChannel,
    jumpToMessage: nav.jumpToMessage,
  };
}
