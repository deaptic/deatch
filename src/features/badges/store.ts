import { STORAGE_KEYS } from "../../platform/storageKeys.ts";
import {
  getChannelChatBadges,
  getGlobalChatBadges,
} from "../../platform/twitch/chat.ts";
import { loadCache, saveCache } from "../../lib/utils/cache.ts";
import { setBadges } from "../feed/index.ts";
import {
  clearSharedChatBadges,
  setSharedChatBadges,
  sharedChatBadges,
} from "./sharedChatBadges.ts";
import type { BadgeMap, BadgeSet } from "../../lib/types/index.ts";
import {
  type ChannelRef,
  channelResource,
} from "../../lib/services/channelResource.ts";

const GLOBAL_BADGES_TTL = 24 * 60 * 60 * 1000;

let globalBadgesPromise: Promise<BadgeSet[]> | null = null;

function loadGlobalBadges(): Promise<BadgeSet[]> {
  if (globalBadgesPromise) return globalBadgesPromise;
  const cached = loadCache<BadgeSet[]>(
    STORAGE_KEYS.globalBadges,
    GLOBAL_BADGES_TTL,
  );
  if (cached) {
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

export function loadSource(channel: ChannelRef) {
  if (sharedChatBadges[channel.id]) return;
  channelBadges.get(channel).then(
    (map) => setSharedChatBadges(channel.id, map),
    () => {},
  );
}

export function forgetChannel(channelId: string) {
  channelBadges.forget(channelId);
}

export function resetChannelCache() {
  channelBadges.clear();
  clearSharedChatBadges();
}
