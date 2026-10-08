import {
  getChannelChatBadges,
  getGlobalChatBadges,
} from "../api/twitch/chat.ts";
import { loadCache, saveCache } from "../utils/cache.ts";
import { setBadges } from "../stores/feeds.ts";
import type { BadgeSet } from "../types/index.ts";
import type { BadgeMap } from "../types/feed.ts";
import { type ChannelRef, channelResource } from "./channelResource.ts";

const GLOBAL_BADGES_CACHE_KEY = "cache:global_badges";
const GLOBAL_BADGES_TTL = 24 * 60 * 60 * 1000;

let globalBadgesPromise: Promise<BadgeSet[]> | null = null;

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
    .catch(() => {
      // A failed load must not be remembered as "no badges" all session.
      globalBadgesPromise = null;
      return [] as BadgeSet[];
    });
  return globalBadgesPromise;
}

function toBadgeMap(sets: BadgeSet[]): BadgeMap {
  const map: BadgeMap = {};
  for (const set of sets) {
    for (const v of set.versions) {
      map[`${set.setId}/${v.id}`] = { url: v.url4x, title: v.title };
    }
  }
  return map;
}

const channelBadges = channelResource((c) =>
  Promise.all([
    loadGlobalBadges(),
    getChannelChatBadges({ broadcasterId: c.id }),
  ]).then(([global, channel]) => toBadgeMap([...global, ...channel]))
);

export async function loadGlobal(): Promise<BadgeMap> {
  return toBadgeMap(await loadGlobalBadges());
}

/// Global badges show at once; channel badges replace them when they land.
export function loadChannel(channel: ChannelRef) {
  loadGlobal().then((map) => setBadges(channel.id, map));
  channelBadges.show(channel, (map) => setBadges(channel.id, map));
}

export function resetChannelCache() {
  channelBadges.clear();
}
