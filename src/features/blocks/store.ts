import { createEffect, createRoot, createSignal, on } from "solid-js";
import {
  blockUser,
  getBlockedUsers,
  unblockUser,
} from "../../platform/twitch/blocks.ts";
import { user } from "../users/index.ts";
import type { UserRef } from "../../shared/types/index.ts";

const [blocked, setBlocked] = createSignal<UserRef[]>([]);
const blockedIds = () => new Set(blocked().map((u) => u.id));
export { blocked };

export function isBlocked(userId: string): boolean {
  return blockedIds().has(userId);
}

export function start(): () => void {
  return createRoot((dispose) => {
    createEffect(
      on(
        () => user()?.id,
        (id) => {
          setBlocked([]);
          if (!id) return;
          getBlockedUsers({ silent: true })
            .then(setBlocked)
            .catch(() => {});
        },
      ),
    );
    return dispose;
  });
}

export async function block(target: UserRef): Promise<void> {
  await blockUser({ userId: target.id });
  setBlocked([...blocked().filter((u) => u.id !== target.id), target]);
}

export async function unblock(userId: string): Promise<void> {
  await unblockUser({ userId });
  setBlocked(blocked().filter((u) => u.id !== userId));
}
