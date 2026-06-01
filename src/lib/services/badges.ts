import {
  getChannelChatBadges,
  getGlobalChatBadges,
} from "../api/twitch/chat.ts";
import { loadCache, saveCache } from "../utils/cache.ts";
import { setBadges } from "../stores/feeds.ts";
import type { BadgeSet } from "../types/twitch/chat.ts";
import type { BadgeMap } from "../types/feed.ts";

const GLOBAL_BADGES_CACHE_KEY = "cache:global_badges";
const GLOBAL_BADGES_TTL = 24 * 60 * 60 * 1000;

let globalBadgesPromise: Promise<BadgeSet[]> | null = null;
const channelBadgesPromise = new Map<string, Promise<BadgeMap>>();

function loadGlobalBadges(): Promise<BadgeSet[]> {
  if (globalBadgesPromise) return globalBadgesPromise;
  const cached = loadCache<BadgeSet[]>(
    GLOBAL_BADGES_CACHE_KEY,
    GLOBAL_BADGES_TTL,
  );
  if (cached) {
    // Stale-while-revalidate: serve cache, refresh in background.
    getGlobalChatBadges()
      .then((fresh) => saveCache(GLOBAL_BADGES_CACHE_KEY, fresh))
      .catch(() => {});
    globalBadgesPromise = Promise.resolve(cached);
    return globalBadgesPromise;
  }
  globalBadgesPromise = getGlobalChatBadges()
    .then((fresh) => {
      saveCache(GLOBAL_BADGES_CACHE_KEY, fresh);
      return fresh;
    })
    .catch(() => [] as BadgeSet[]);
  return globalBadgesPromise;
}

export function loadChannelBadges(broadcasterId: string): Promise<BadgeMap> {
  const cached = channelBadgesPromise.get(broadcasterId);
  if (cached) {
    cached.then((map) => setBadges(broadcasterId, map));
    return cached;
  }
  const fresh = Promise.all([
    loadGlobalBadges(),
    getChannelChatBadges({ broadcasterId }).catch(() => [] as BadgeSet[]),
  ]).then(([global, channel]) => {
    const map: BadgeMap = {};
    for (const set of global) {
      for (const v of set.versions) {
        map[`${set.setId}/${v.id}`] = { url: v.url1x, title: v.title };
      }
    }
    for (const set of channel) {
      for (const v of set.versions) {
        map[`${set.setId}/${v.id}`] = { url: v.url1x, title: v.title };
      }
    }
    setBadges(broadcasterId, map);
    return map;
  });
  channelBadgesPromise.set(broadcasterId, fresh);
  return fresh;
}

export function resetChannelBadgeCache() {
  channelBadgesPromise.clear();
}
