import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { streamUserEmotes, getGlobalEmotes } from "../commands/chat";
import type { GlobalEmote, RustEmoteEntry, SevenTvChannelResult, UserEmote } from "../types";
import { loadCache, saveCache } from "./cache";
import { user } from "./users";

const USER_EMOTES_TTL = 6 * 60 * 60 * 1000; // 6 hours
const GLOBAL_EMOTES_CACHE_KEY = "cache:global_emotes";
const GLOBAL_EMOTES_TTL = 24 * 60 * 60 * 1000; // 24 hours

function userEmotesCacheKey(userId: string): string {
  return `cache:user_emotes:${userId}`;
}

export type EmoteMap = Record<string, string>;
export type EmoteEntry = { name: string; url: string };
export type EmoteSection = { id: string; label: string; emotes: EmoteEntry[] };
export type FavoriteEmote = { value: string; url: string; label: string };
export type ChannelEmoteResult = {
  sections: EmoteSection[];
  flat: EmoteMap;
  sevenTvEmoteSetId: string | null;
};

const FAVORITES_KEY = "emote_favorites";

const initialFavorites: FavoriteEmote[] = (() => {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]"); }
  catch { return []; }
})();

const [favorites, setFavorites] = createSignal<FavoriteEmote[]>(initialFavorites);
export { favorites };

export const [globalEmotes, setGlobalEmotes] = createSignal<GlobalEmote[]>([]);
export const [userEmotes, setUserEmotes] = createSignal<UserEmote[]>([]);
export const [sevenTvGlobal, setSevenTvGlobal] = createSignal<EmoteEntry[]>([]);
export const [bttvGlobal, setBttvGlobal] = createSignal<EmoteEntry[]>([]);
export const [ffzGlobal, setFfzGlobal] = createSignal<EmoteEntry[]>([]);
export const [sevenTvChannel, setSevenTvChannel] = createSignal<EmoteEntry[]>([]);
export const [bttvChannel, setBttvChannel] = createSignal<EmoteEntry[]>([]);
export const [ffzChannel, setFfzChannel] = createSignal<EmoteEntry[]>([]);

export function buildThirdPartyEmoteMap(): EmoteMap {
  const map: EmoteMap = {};
  for (const e of sevenTvGlobal()) map[e.name] = e.url;
  for (const e of bttvGlobal()) map[e.name] = e.url;
  for (const e of ffzGlobal()) map[e.name] = e.url;
  for (const e of sevenTvChannel()) map[e.name] = e.url;
  for (const e of bttvChannel()) map[e.name] = e.url;
  for (const e of ffzChannel()) map[e.name] = e.url;
  return map;
}

function persistFavorites(list: FavoriteEmote[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  setFavorites(list);
}

export function toggleFavorite(emote: FavoriteEmote) {
  const list = favorites();
  const idx = list.findIndex((e) => e.value === emote.value);
  if (idx >= 0) persistFavorites(list.filter((_, i) => i !== idx));
  else persistFavorites([...list, emote]);
}

export function isFavorite(value: string): boolean {
  return favorites().some((e) => e.value === value);
}

function toFlat(sections: EmoteSection[]): EmoteMap {
  const flat: EmoteMap = {};
  for (const section of sections)
    for (const e of section.emotes) flat[e.name] = e.url;
  return flat;
}

let userEmotesLoadStarted = false;

export function appendUserEmotes(page: UserEmote[]) {
  setUserEmotes((prev) => [...prev, ...page]);
}

export function resetUserEmotes() {
  setUserEmotes([]);
  userEmotesLoadStarted = false;
  // Cache stays — it's keyed by user_id so the next user can't see this one's.
}

/// Kicks off a fetch of the user's emote inventory. Idempotent — only the
/// first call per session does work. Hits localStorage first; if the cache
/// is fresh (< 6h), uses it directly. Otherwise streams from Twitch (pages
/// arrive via `user-emote-page` in `events.ts`) and persists the final list.
export async function ensureUserEmotesLoaded(): Promise<void> {
  if (userEmotesLoadStarted) return;
  const u = user();
  if (!u) return;
  userEmotesLoadStarted = true;

  const key = userEmotesCacheKey(u.id);
  const cached = loadCache<UserEmote[]>(key, USER_EMOTES_TTL);
  if (cached) {
    setUserEmotes(cached);
    return;
  }

  try {
    await streamUserEmotes();
    saveCache(key, userEmotes());
  } catch {
    userEmotesLoadStarted = false;
  }
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

export async function fetchSevenTvGlobalEmotes(): Promise<EmoteEntry[]> {
  try { return await invoke<RustEmoteEntry[]>("seventv_get_global_emotes"); }
  catch { return []; }
}

export async function fetchBttvGlobalEmotes(): Promise<EmoteEntry[]> {
  try { return await invoke<RustEmoteEntry[]>("bttv_get_global_emotes"); }
  catch { return []; }
}

export async function fetchFfzGlobalEmotes(): Promise<EmoteEntry[]> {
  try { return await invoke<RustEmoteEntry[]>("ffz_get_global_emotes"); }
  catch { return []; }
}

export async function fetchChannelEmotes(channelId: string, channelLogin: string): Promise<ChannelEmoteResult> {
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
