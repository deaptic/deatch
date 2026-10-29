import { STORAGE_KEYS } from "../constants/storage.ts";
import {
  getChannelChatBadges,
  getGlobalChatBadges,
} from "../api/twitch/chat.ts";
import { loadCache, saveCache } from "../utils/cache.ts";
import { setBadges } from "../stores/feeds.ts";
import {
  clearSourceBadges,
  setSourceBadges,
  sourceBadges,
} from "../stores/sourceBadges.ts";
import type { BadgeMap, BadgeSet } from "../types/index.ts";
import { type ChannelRef, channelResource } from "./channelResource.ts";

const GLOBAL_BADGES_TTL = 24 * 60 * 60 * 1000;

let globalBadgesPromise: Promise<BadgeSet[]> | null = null;

function loadGlobalBadges(): Promise<BadgeSet[]> {
  if (globalBadgesPromise) return globalBadgesPromise;
  const cached = loadCache<BadgeSet[]>(
    STORAGE_KEYS.globalBadges,
    GLOBAL_BADGES_TTL,
  );
  if (cached) {
    // Stale-while-revalidate: serve cache, refresh in background.
    getGlobalChatBadges({ silent: true })
      .then((fetched) => saveCache(STORAGE_KEYS.globalBadges, fetched))
      .catch(() => {});
    globalBadgesPromise = Promise.resolve(cached);
    return globalBadgesPromise;
  }
  globalBadgesPromise = getGlobalChatBadges({ silent: true })
    .then((fetched) => {
      saveCache(STORAGE_KEYS.globalBadges, fetched);
      return fetched;
    })
    .catch((e) => {
      // Rejecting keeps a failure out of every cached channel map, so both
      // this and the channel loads retry instead of lacking global badges.
      globalBadgesPromise = null;
      throw e;
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
    getChannelChatBadges({ broadcasterId: c.id }, { silent: true }),
  ]).then(([global, channel]) => toBadgeMap([...global, ...channel])),
);

export async function loadGlobal(): Promise<BadgeMap> {
  return toBadgeMap(await loadGlobalBadges().catch(() => []));
}

/// Global badges show at once; channel badges replace them when they land.
export function loadChannel(channel: ChannelRef) {
  let channelLanded = false;
  void loadGlobal().then((map) => {
    if (!channelLanded) setBadges(channel.id, map);
  });
  channelBadges.show(channel, (map) => {
    channelLanded = true;
    setBadges(channel.id, map);
  });
}

/// A shared chat partner's badges, fetched once and kept while signed in.
export function loadSource(channel: ChannelRef) {
  if (sourceBadges[channel.id]) return;
  channelBadges.get(channel).then(
    (map) => setSourceBadges(channel.id, map),
    () => {},
  );
}

export function forgetChannel(channelId: string) {
  channelBadges.forget(channelId);
}

export function resetChannelCache() {
  channelBadges.clear();
  clearSourceBadges();
}
