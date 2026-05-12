import { createSignal } from "solid-js";
import type { ModeratedChannel } from "../types";
import type { User } from "../commands/users";

export const [user, setUser] = createSignal<User | null>(null);
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

export type Chatter = {
  id: string;
  login: string;
  displayName: string;
  color: string;
  lastSeen: number;
};

export const chattersByChannel = new Map<string, Map<string, Chatter>>();

export function recordChatter(channelId: string, c: Chatter) {
  let bucket = chattersByChannel.get(channelId);
  if (!bucket) {
    bucket = new Map();
    chattersByChannel.set(channelId, bucket);
  }
  bucket.set(c.id, c);
}
