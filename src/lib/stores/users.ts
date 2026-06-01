import { createSignal } from "solid-js";
import type { User } from "../api/twitch/users";
import type { UserRef } from "../types/twitch/user";

export const [user, setUser] = createSignal<User | null>(null);
export const [moderatedChannels, setModeratedChannels] = createSignal<UserRef[]>([]);

export function isBroadcasterOfChannel(broadcasterId: string): boolean {
  return user()?.id === broadcasterId;
}

export function isModOfChannel(broadcasterId: string): boolean {
  if (isBroadcasterOfChannel(broadcasterId)) return true;
  return moderatedChannels().some((m) => m.id === broadcasterId);
}

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
  const existing = bucket.get(c.id);
  if (existing && existing.lastSeen >= c.lastSeen) return;
  bucket.set(c.id, c);
}
