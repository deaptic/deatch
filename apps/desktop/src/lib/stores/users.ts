import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import type { User, UserRef } from "../types/index.ts";
import type { KnownUser } from "../utils/knownUsers.ts";

export const [user, setUser] = createSignal<User | null>(null);
export const [moderatedChannels, setModeratedChannels] = createSignal<
  UserRef[]
>([]);

export function isBroadcasterOfChannel(broadcasterId: string): boolean {
  return user()?.id === broadcasterId;
}

export function isModOfChannel(broadcasterId: string): boolean {
  if (isBroadcasterOfChannel(broadcasterId)) return true;
  return moderatedChannels().some((m) => m.id === broadcasterId);
}

export const [knownUsers, setKnownUsers] = createStore<
  Record<string, KnownUser>
>({});

export function knownUser(id: string): User | undefined {
  return knownUsers[id]?.user;
}

export type Chatter = {
  id: string;
  login: string;
  displayName: string;
  color: string;
  lastSeen: number;
};

export const chattersByChannel = new Map<string, Map<string, Chatter>>();

const MAX_CHATTERS_PER_CHANNEL = 1000;

function pruneChatters(bucket: Map<string, Chatter>) {
  const recent = [...bucket.values()]
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, MAX_CHATTERS_PER_CHANNEL);
  bucket.clear();
  for (const c of recent) bucket.set(c.id, c);
}

export function knownChatterColor(userId: string): string | undefined {
  for (const bucket of chattersByChannel.values()) {
    const chatter = bucket.get(userId);
    if (chatter) return chatter.color;
  }
  return undefined;
}

export function recordChatter(channelId: string, c: Chatter) {
  let bucket = chattersByChannel.get(channelId);
  if (!bucket) {
    bucket = new Map();
    chattersByChannel.set(channelId, bucket);
  }
  const existing = bucket.get(c.id);
  if (existing && existing.lastSeen >= c.lastSeen) return;
  bucket.set(c.id, c);
  if (bucket.size > MAX_CHATTERS_PER_CHANNEL + 200) pruneChatters(bucket);
}

export function clearChatters(channelId: string) {
  chattersByChannel.delete(channelId);
}
