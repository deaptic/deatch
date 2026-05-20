import { invoke } from "@tauri-apps/api/core";
import { streamUserEmotes, getGlobalEmotes } from "../commands/chat";
import type { GlobalEmote, UserEmote } from "../types";
import { loadCache, saveCache } from "../utils/cache";
import { user } from "../state/users";
import {
  type EmoteEntry,
  dedupeById,
  setBttvChannel,
  setBttvGlobal,
  setFfzChannel,
  setFfzGlobal,
  setGlobalEmotes,
  setSevenTvChannel,
  setSevenTvGlobal,
  setUserEmotes,
  userEmotes,
} from "../state/emotes";

type SevenTvChannelResult = { emotes: EmoteEntry[]; emote_set_id: string | null };

const USER_EMOTES_TTL = 6 * 60 * 60 * 1000; // 6 hours
const GLOBAL_EMOTES_CACHE_KEY = "cache:global_emotes";
const GLOBAL_EMOTES_TTL = 24 * 60 * 60 * 1000; // 24 hours

function userEmotesCacheKey(userId: string): string {
  return `cache:user_emotes:${userId}`;
}

let userEmotesLoadStarted = false;

/// Kicks off a fetch of the user's emote inventory. Idempotent — only the
/// first call per session does work. Hits localStorage first; if the cache
/// is fresh (< 6h), uses it directly. Otherwise streams from Twitch — pages
/// arrive via the `user-emote-page` listener in `events/index.ts`.
export async function ensureUserEmotesLoaded(): Promise<void> {
  if (userEmotesLoadStarted) return;
  const u = user();
  if (!u) return;
  userEmotesLoadStarted = true;

  const key = userEmotesCacheKey(u.id);
  const cached = loadCache<UserEmote[]>(key, USER_EMOTES_TTL);
  if (cached) {
    setUserEmotes(dedupeById(cached));
    return;
  }

  try {
    await streamUserEmotes();
    saveCache(key, userEmotes());
  } catch {
    userEmotesLoadStarted = false;
  }
}

/// Clears the user-emote signal and resets the loader's idempotency flag.
/// Call on logout so the next user starts fresh.
export function resetUserEmotes() {
  setUserEmotes([]);
  userEmotesLoadStarted = false;
  // localStorage cache stays — it's keyed by user_id so it's safe.
}

/// Returns global emotes, hitting localStorage first (24h TTL). On a cache
/// hit, kicks off a background refresh so the data stays fresh across
/// sessions without blocking startup.
export async function loadGlobalEmotes(): Promise<GlobalEmote[]> {
  const cached = loadCache<GlobalEmote[]>(GLOBAL_EMOTES_CACHE_KEY, GLOBAL_EMOTES_TTL);
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

let thirdPartyGlobalsLoaded = false;

/// Loads 7TV / BTTV / FFZ global emote sets in parallel. Idempotent — only
/// the first call per session does any work.
export function loadThirdPartyGlobalEmotes() {
  if (thirdPartyGlobalsLoaded) return;
  thirdPartyGlobalsLoaded = true;
  invoke<EmoteEntry[]>("seventv_get_global_emotes").then(setSevenTvGlobal).catch(() => {});
  invoke<EmoteEntry[]>("bttv_get_global_emotes").then(setBttvGlobal).catch(() => {});
  invoke<EmoteEntry[]>("ffz_get_global_emotes").then(setFfzGlobal).catch(() => {});
}

const channelEmoteCache = new Map<string, Promise<EmoteEntry[]>>();

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

/// Fetches per-channel 7TV / BTTV / FFZ emotes and updates the channel
/// emote signals. Results are cached per channel id for the session.
export function loadChannelThirdPartyEmotes(channelId: string, channelLogin: string) {
  cachedChannelFetch(`stv:${channelId}`, () =>
    invoke<SevenTvChannelResult>("seventv_get_channel_emotes", { channelId }).then((r) => r.emotes),
  ).then(setSevenTvChannel);
  cachedChannelFetch(`bttv:${channelId}`, () =>
    invoke<EmoteEntry[]>("bttv_get_channel_emotes", { channelId }),
  ).then(setBttvChannel);
  cachedChannelFetch(`ffz:${channelLogin}`, () =>
    invoke<EmoteEntry[]>("ffz_get_channel_emotes", { channelLogin }),
  ).then(setFfzChannel);
}

export function resetChannelThirdPartyEmoteCache() {
  channelEmoteCache.clear();
}
