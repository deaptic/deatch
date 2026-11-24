import type { User } from "../shared/types/index.ts";
import { createChannelNavigation } from "../features/navigation/index.ts";
import { createLinkControls } from "../features/link/index.ts";
import { createSelectedChannelEffects } from "./createSelectedChannelEffects.ts";
import * as inbox from "../features/inbox/index.ts";
import * as whispers from "../features/whispers/index.ts";
import { createTaskbarBadge } from "./createTaskbarBadge.ts";
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
  const link = createLinkControls(nav);

  createSelectedChannelEffects();
  createTaskbarBadge(() => inbox.unreadCount() + whispers.unreadCount());
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
