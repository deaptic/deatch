import type { User } from "../types/index.ts";
import { createChannelNavigation } from "./createChannelNavigation.ts";
import { createLinkControls } from "../../features/link/index.ts";
import { createChannelHooks } from "./createChannelHooks.ts";
import { createSelectedChannelEffects } from "./createSelectedChannelEffects.ts";
import { createMentionsBadge } from "../../features/inbox/index.ts";
import { createSystemIntegration } from "./createSystemIntegration.ts";
import { createSessionLifecycle } from "./createSessionLifecycle.ts";
import { createAppShortcuts } from "./createAppShortcuts.ts";
import { createServices } from "./createServices.ts";

export type AppController = {
  selectChannel: (ch: User) => void;
  toggleLink: () => void;
  openChannel: (broadcasterId: string) => void;
  jumpToMessage: (broadcasterId: string, messageId: string) => void;
};

export function createAppController(): AppController {
  createServices();
  const nav = createChannelNavigation();
  createChannelHooks();
  const link = createLinkControls(nav);

  createSelectedChannelEffects();
  createMentionsBadge();
  createSystemIntegration();
  createSessionLifecycle();
  createAppShortcuts(nav, link);

  return {
    selectChannel: nav.selectChannel,
    toggleLink: link.toggleLink,
    openChannel: nav.openChannel,
    jumpToMessage: nav.jumpToMessage,
  };
}
