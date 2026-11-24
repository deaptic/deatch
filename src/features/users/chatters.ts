import type { Chatter } from "./types.ts";
import * as channels from "../channels/index.ts";
import { recordIn } from "./chatterBucket.ts";

const chattersByChannel = new Map<string, Map<string, Chatter>>();

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

export function start(): () => void {
  return channels.onChannel({
    leave: (id) => chattersByChannel.delete(id),
  });
}
