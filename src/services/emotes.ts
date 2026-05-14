import { invoke } from "@tauri-apps/api/core";
import { streamUserEmotes, getGlobalEmotes } from "../commands/chat";
import type { GlobalEmote, RustEmoteEntry, SevenTvChannelResult, UserEmote } from "../types";
import { loadCache, saveCache } from "../utils/cache";
import { user } from "../state/users";
import {
  type ChannelEmoteResult,
  type EmoteEntry,
  type EmoteMap,
  type EmoteSection,
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

function toFlat(sections: EmoteSection[]): EmoteMap {
  const flat: EmoteMap = {};
  for (const section of sections)
    for (const e of section.emotes) flat[e.name] = e.url;
  return flat;
}

export async function fetchChannelEmotes(
  channelId: string,
  channelLogin: string,
): Promise<ChannelEmoteResult> {
  const [stv, bttv, ffz] = await Promise.allSettled([
    invoke<SevenTvChannelResult>("seventv_get_channel_emotes", { channelId }),
    invoke<RustEmoteEntry[]>("bttv_get_channel_emotes", { channelId }),
    invoke<RustEmoteEntry[]>("ffz_get_channel_emotes", { channelLogin }),
  ]);

  const stvResult = stv.status === "fulfilled" ? stv.value : { emotes: [], emote_set_id: null };
  const bttvEmotes = bttv.status === "fulfilled" ? bttv.value : [];
  const ffzEmotes = ffz.status === "fulfilled" ? ffz.value : [];

  const sections: EmoteSection[] = [
    ...(stvResult.emotes.length ? [{ id: "7tv-channel", label: "7TV", emotes: stvResult.emotes }] : []),
    ...(bttvEmotes.length ? [{ id: "bttv-channel", label: "BetterTTV", emotes: bttvEmotes }] : []),
    ...(ffzEmotes.length ? [{ id: "ffz-channel", label: "FrankerFaceZ", emotes: ffzEmotes }] : []),
  ];

  return { sections, flat: toFlat(sections), sevenTvEmoteSetId: stvResult.emote_set_id };
}

let thirdPartyGlobalsLoaded = false;

/// Loads 7TV / BTTV / FFZ global emote sets in parallel. Idempotent — only
/// the first call per session does any work.
export function loadThirdPartyGlobalEmotes() {
  if (thirdPartyGlobalsLoaded) return;
  thirdPartyGlobalsLoaded = true;
  invoke<RustEmoteEntry[]>("seventv_get_global_emotes").then(setSevenTvGlobal).catch(() => {});
  invoke<RustEmoteEntry[]>("bttv_get_global_emotes").then(setBttvGlobal).catch(() => {});
  invoke<RustEmoteEntry[]>("ffz_get_global_emotes").then(setFfzGlobal).catch(() => {});
}

const sevenTvChannelCache = new Map<string, Promise<EmoteEntry[]>>();
const bttvChannelCache = new Map<string, Promise<EmoteEntry[]>>();
const ffzChannelCache = new Map<string, Promise<EmoteEntry[]>>();

/// Fetches per-channel 7TV / BTTV / FFZ emotes and updates the channel
/// emote signals. Results are cached per channel id for the session.
export function loadChannelThirdPartyEmotes(channelId: string, channelLogin: string) {
  let stv = sevenTvChannelCache.get(channelId);
  if (!stv) {
    stv = invoke<SevenTvChannelResult>("seventv_get_channel_emotes", { channelId })
      .then((r) => r.emotes)
      .catch(() => [] as EmoteEntry[]);
    sevenTvChannelCache.set(channelId, stv);
  }
  stv.then(setSevenTvChannel);

  let bttv = bttvChannelCache.get(channelId);
  if (!bttv) {
    bttv = invoke<EmoteEntry[]>("bttv_get_channel_emotes", { channelId })
      .catch(() => [] as EmoteEntry[]);
    bttvChannelCache.set(channelId, bttv);
  }
  bttv.then(setBttvChannel);

  let ffz = ffzChannelCache.get(channelId);
  if (!ffz) {
    ffz = invoke<EmoteEntry[]>("ffz_get_channel_emotes", { channelLogin })
      .catch(() => [] as EmoteEntry[]);
    ffzChannelCache.set(channelId, ffz);
  }
  ffz.then(setFfzChannel);
}

export function resetChannelThirdPartyEmoteCache() {
  sevenTvChannelCache.clear();
  bttvChannelCache.clear();
  ffzChannelCache.clear();
}
