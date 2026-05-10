import { createSignal } from "solid-js";
import type { UserInfo, ModeratedChannel } from "../types";
import type { User } from "../commands/users";

export const [user, setUser] = createSignal<UserInfo | null>(null);
export const [moderatedChannels, setModeratedChannels] = createSignal<ModeratedChannel[]>([]);

const [userCacheSig, setUserCacheSig] = createSignal<Record<string, User>>({});
export const userCache = userCacheSig;

export function cacheUsers(users: User[]) {
  setUserCacheSig((prev) => {
    const next = { ...prev };
    for (const u of users) next[u.id] = u;
    return next;
  });
}

export const pendingUserById = new Map<string, Promise<void>>();
