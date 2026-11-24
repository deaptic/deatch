import { createSignal } from "solid-js";
import { createPopover } from "../../kit/createPopover.ts";
import type { ModAction } from "../menus/index.ts";
import { users } from "../users/index.ts";
import type { FeedEvent, FeedMessage } from "../feed/index.ts";
import type { UserRef } from "../../shared/types/index.ts";
import { createUserCards } from "./createUserCards.ts";

export type ModTarget = { action: ModAction; userId: string; userName: string };

export function createChatOverlays() {
  const messageMenu = createPopover<{ msg: FeedMessage }>();
  const userMenu = createPopover<{
    userId: string;
    userLogin: string;
    userDisplayName: string;
  }>();
  const eventMenu = createPopover<{ item: FeedEvent }>();
  const userCards = createUserCards();
  const [modAction, setModAction] = createSignal<ModTarget | null>(null);

  async function openUserCard(x: number, y: number, who: Partial<UserRef>) {
    const id = await users.resolveId(who);
    if (id) userCards.open(x, y, id);
  }

  async function openUserMenu(x: number, y: number, who: Partial<UserRef>) {
    const r = await users.resolve(who);
    if (r) {
      userMenu.open(x, y, {
        userId: r.id,
        userLogin: r.login,
        userDisplayName: r.displayName,
      });
    }
  }

  return {
    messageMenu,
    userMenu,
    eventMenu,
    userCards,
    modAction,
    setModAction,
    openUserCard,
    openUserMenu,
  };
}

export type ChatOverlays = ReturnType<typeof createChatOverlays>;
