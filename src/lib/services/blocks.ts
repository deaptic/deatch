import { createEffect, createRoot, on } from "solid-js";
import {
  blockUser,
  getBlockedUsers,
  unblockUser,
} from "../../platform/twitch/blocks.ts";
import { blockedUsers, setBlockedUsers } from "../stores/blocks.ts";
import { user } from "../stores/users.ts";
import type { UserRef } from "../types/index.ts";

export function start(): () => void {
  return createRoot((dispose) => {
    createEffect(
      on(
        () => user()?.id,
        (id) => {
          setBlockedUsers([]);
          if (!id) return;
          getBlockedUsers({ silent: true })
            .then(setBlockedUsers)
            .catch(() => {});
        },
      ),
    );
    return dispose;
  });
}

export async function block(target: UserRef): Promise<void> {
  await blockUser({ userId: target.id });
  setBlockedUsers([
    ...blockedUsers().filter((u) => u.id !== target.id),
    target,
  ]);
}

export async function unblock(userId: string): Promise<void> {
  await unblockUser({ userId });
  setBlockedUsers(blockedUsers().filter((u) => u.id !== userId));
}
