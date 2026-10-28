import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import type { Chatter, User, UserRef } from "../types/index.ts";
import type { KnownUser } from "../utils/knownUsers.ts";
import { recordIn } from "../utils/chatters.ts";

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

const chattersByChannel = new Map<string, Map<string, Chatter>>();

/// Who has chatted in the channel lately, as far as this session saw.
export function chattersIn(broadcasterId: string): Iterable<Chatter> {
  return chattersByChannel.get(broadcasterId)?.values() ?? [];
}

export function knownChatterColor(userId: string): string | undefined {
  for (const bucket of chattersByChannel.values()) {
    const chatter = bucket.get(userId);
    if (chatter) return chatter.color;
  }
  return undefined;
}

export function recordChatter(broadcasterId: string, c: Chatter) {
  let bucket = chattersByChannel.get(broadcasterId);
  if (!bucket) {
    bucket = new Map();
    chattersByChannel.set(broadcasterId, bucket);
  }
  recordIn(bucket, c);
}

export function clearChatters(broadcasterId: string) {
  chattersByChannel.delete(broadcasterId);
}
