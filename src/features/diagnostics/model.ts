import type { AppStats } from "../../platform/bindings.ts";

export type CacheStats = {
  users: number;
  channels: number;
  messages: number;
};

export type Sample = {
  app: AppStats;
  cache: CacheStats;
  jsHeapBytes: number | null;
};

export function countCache(
  feeds: Record<string, { messages: unknown[] } | undefined>,
  users: Record<string, unknown>,
): CacheStats {
  const channels = Object.values(feeds).filter((feed) => feed !== undefined);
  return {
    users: Object.keys(users).length,
    channels: channels.length,
    messages: channels.reduce((sum, feed) => sum + feed.messages.length, 0),
  };
}
