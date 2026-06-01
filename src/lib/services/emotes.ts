import { bttvGetChannelEmotes, bttvGetGlobalEmotes } from "../api/external/bttv.ts";
import { ffzGetChannelEmotes, ffzGetGlobalEmotes } from "../api/external/ffz.ts";
import { seventvGetGlobalEmotes } from "../api/external/seventv.ts";
import { getGlobalEmotes, getUserEmotes } from "../api/twitch/chat.ts";
import { fetchAllPages } from "../api/utils.ts";
import {
  dedupeById,
  setBttvChannel,
  setBttvGlobal,
  setFfzChannel,
  setFfzGlobal,
  setGlobalEmotes,
  setSevenTvGlobal,
  setUserEmotes,
} from "../stores/emotes.ts";
import { user } from "../stores/users.ts";
import type { EmoteEntry } from "../types/external/emote.ts";
import type { Emote, UserEmote } from "../types/twitch/chat.ts";
import { loadCache, saveCache } from "../utils/cache.ts";

const USER_EMOTES_TTL = 6 * 60 * 60 * 1000;
const GLOBAL_EMOTES_CACHE_KEY = "cache:global_emotes";
const GLOBAL_EMOTES_TTL = 24 * 60 * 60 * 1000;

const channelEmoteCache = new Map<string, Promise<EmoteEntry[]>>();

let userEmotesLoadStarted = false;
let thirdPartyGlobalsLoaded = false;

export async function ensureUserEmotesLoaded(): Promise<void> {
  if (userEmotesLoadStarted) return;
  const u = user();
  if (!u) return;
  userEmotesLoadStarted = true;

  const key = `cache:user_emotes:${u.id}`;
  const cached = loadCache<UserEmote[]>(key, USER_EMOTES_TTL);
  if (cached) {
    setUserEmotes(dedupeById(cached));
    return;
  }

  try {
    const all = await fetchAllPages<UserEmote>("get_user_emotes", (after, opts) =>
      getUserEmotes({ after }, opts),
    );
    setUserEmotes(dedupeById(all));
    saveCache(key, all);
  } catch {
    userEmotesLoadStarted = false;
  }
}

export function resetUserEmotes() {
  setUserEmotes([]);
  userEmotesLoadStarted = false;
}

export async function loadGlobalEmotes(): Promise<Emote[]> {
  const cached = loadCache<Emote[]>(GLOBAL_EMOTES_CACHE_KEY, GLOBAL_EMOTES_TTL);
  if (cached) {
    getGlobalEmotes()
      .then((fresh) => {
        saveCache(GLOBAL_EMOTES_CACHE_KEY, fresh);
        setGlobalEmotes(fresh);
      })
      .catch(() => {});
    return cached;
  }
  const fresh = await getGlobalEmotes();
  saveCache(GLOBAL_EMOTES_CACHE_KEY, fresh);
  return fresh;
}

export function loadThirdPartyGlobalEmotes() {
  if (thirdPartyGlobalsLoaded) return;
  thirdPartyGlobalsLoaded = true;
  seventvGetGlobalEmotes({ silent: true }).then(setSevenTvGlobal).catch(() => {});
  bttvGetGlobalEmotes({ silent: true }).then(setBttvGlobal).catch(() => {});
  ffzGetGlobalEmotes({ silent: true }).then(setFfzGlobal).catch(() => {});
}

function cachedChannelFetch(
  key: string,
  fetch: () => Promise<EmoteEntry[]>,
): Promise<EmoteEntry[]> {
  let p = channelEmoteCache.get(key);
  if (!p) {
    p = fetch().catch(() => [] as EmoteEntry[]);
    channelEmoteCache.set(key, p);
  }
  return p;
}

export function loadChannelThirdPartyEmotes(
  channelId: string,
  channelLogin: string,
) {
  cachedChannelFetch(`bttv:${channelId}`, () =>
    bttvGetChannelEmotes({ channelId }, { silent: true }),
  ).then(setBttvChannel);
  cachedChannelFetch(`ffz:${channelLogin}`, () =>
    ffzGetChannelEmotes({ channelLogin }, { silent: true }),
  ).then(setFfzChannel);
}

export function resetChannelThirdPartyEmoteCache() {
  channelEmoteCache.clear();
}
