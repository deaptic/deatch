import {
  isUserEmotesKey,
  STORAGE_KEYS,
  type StorageKey,
  userEmotesKey,
} from "../constants/storage.ts";
import { type EmoteUse, withUse } from "../utils/emoteUsage.ts";
import {
  bttvGetChannelEmotes,
  bttvGetGlobalEmotes,
} from "../api/external/bttv.ts";
import {
  ffzGetChannelEmotes,
  ffzGetGlobalEmotes,
} from "../api/external/ffz.ts";
import { seventvGetGlobalEmotes } from "../api/external/seventv.ts";
import { getGlobalEmotes, getUserEmotes } from "../api/twitch/chat.ts";
import type { InvokeOptions } from "../api/utils.ts";
import { createEffect, createRoot } from "solid-js";
import {
  bttvChannel,
  bttvGlobal,
  ffzChannel,
  favorites,
  ffzGlobal,
  type FavoriteEmote,
  setBttvChannel,
  setBttvGlobal,
  setFavorites,
  emoteUses,
  setEmoteUses,
  setFfzChannel,
  setFfzGlobal,
  setGlobalEmotes,
  setSevenTvGlobal,
  setThirdPartyEmoteMap,
  setUserEmotes,
  sevenTvChannel,
  sevenTvGlobal,
} from "../stores/emotes.ts";
import { user } from "../stores/users.ts";
import { type ChannelRef, channelResource } from "./channelResource.ts";
import type { Emote, EmoteEntry, UserEmote } from "../types/index.ts";
import { createBackoff } from "../utils/backoff.ts";
import { loadCache, saveCache } from "../utils/cache.ts";
import { emoteMap } from "../utils/emoteMap.ts";
import { dedupeById } from "../utils/emoteSections.ts";
import * as storage from "../utils/storage.ts";

const USER_EMOTES_TTL = 6 * 60 * 60 * 1000;
const GLOBAL_EMOTES_TTL = 24 * 60 * 60 * 1000;
const GLOBALS_RETRY_MIN_MS = 30_000;
const GLOBALS_RETRY_MAX_MS = 300_000;

const bttv = channelResource((c) =>
  bttvGetChannelEmotes({ broadcasterId: c.id }, { silent: true }),
);
const ffz = channelResource((c) =>
  ffzGetChannelEmotes({ broadcasterLogin: c.login }, { silent: true }),
);

let userEmotesLoadStarted = false;
let globalLoadStarted = false;
const globalRetry = createBackoff(GLOBALS_RETRY_MIN_MS, GLOBALS_RETRY_MAX_MS);

export async function ensureUserLoaded(): Promise<void> {
  if (userEmotesLoadStarted) return;
  const u = user();
  if (!u) return;
  userEmotesLoadStarted = true;

  const key = userEmotesKey(u.id);
  storage.removeWhere((k) => isUserEmotesKey(k) && k !== key);
  const cached = loadCache<UserEmote[]>(key, USER_EMOTES_TTL);
  if (cached) {
    setUserEmotes(dedupeById(cached));
    return;
  }

  try {
    const all = await getUserEmotes({ silent: true });
    setUserEmotes(dedupeById(all));
    saveCache(key, all);
  } catch {
    userEmotesLoadStarted = false;
  }
}

export function resetUser() {
  setUserEmotes([]);
  userEmotesLoadStarted = false;
  globalLoadStarted = false;
  globalRetry.reset();
}

export function ensureGlobalLoaded(): void {
  if (globalLoadStarted || !user()) return;
  globalLoadStarted = true;
  loadGlobal().then(
    () => globalRetry.succeeded(),
    () => {
      globalLoadStarted = false;
      globalRetry.schedule(ensureGlobalLoaded);
    },
  );
}

async function loadGlobal(): Promise<void> {
  const cached = loadCache<Emote[]>(
    STORAGE_KEYS.globalEmotes,
    GLOBAL_EMOTES_TTL,
  );
  if (cached) {
    setGlobalEmotes(cached);
    fetchGlobal().catch(() => {});
    return;
  }
  await fetchGlobal();
}

async function fetchGlobal(): Promise<void> {
  const fetched = await getGlobalEmotes({ silent: true });
  saveCache(STORAGE_KEYS.globalEmotes, fetched);
  setGlobalEmotes(fetched);
}

export function start(): () => void {
  setFavorites(loadSaved(STORAGE_KEYS.emoteFavorites));
  setEmoteUses(loadUses());
  const stops = [
    keepLoading(seventvGetGlobalEmotes, setSevenTvGlobal),
    keepLoading(bttvGetGlobalEmotes, setBttvGlobal),
    keepLoading(ffzGetGlobalEmotes, setFfzGlobal),
    createRoot((dispose) => {
      createEffect(() =>
        setThirdPartyEmoteMap(
          emoteMap([
            sevenTvGlobal(),
            bttvGlobal(),
            ffzGlobal(),
            sevenTvChannel(),
            bttvChannel(),
            ffzChannel(),
          ]),
        ),
      );
      return dispose;
    }),
  ];
  return () => {
    for (const stop of stops) stop();
  };
}

function keepLoading(
  load: (options: InvokeOptions) => Promise<EmoteEntry[]>,
  set: (emotes: EmoteEntry[]) => void,
): () => void {
  const retry = createBackoff(GLOBALS_RETRY_MIN_MS, GLOBALS_RETRY_MAX_MS);
  let stopped = false;
  function attempt() {
    load({ silent: true }).then(set, () => {
      if (!stopped) retry.schedule(attempt);
    });
  }
  attempt();
  return () => {
    stopped = true;
    retry.reset();
  };
}

export function loadChannelThirdParty(channel: ChannelRef) {
  bttv.show(channel, setBttvChannel);
  ffz.show(channel, setFfzChannel);
}

export function forgetChannelThirdParty(channelId: string) {
  bttv.forget(channelId);
  ffz.forget(channelId);
}

export function resetChannelThirdParty() {
  bttv.clear();
  ffz.clear();
}

function loadSaved(key: StorageKey): FavoriteEmote[] {
  const stored = storage.read(key);
  return Array.isArray(stored) ? stored.filter(isFavorite) : [];
}

function isFavorite(value: unknown): value is FavoriteEmote {
  if (typeof value !== "object" || value === null) return false;
  const f = value as Record<string, unknown>;
  return (
    typeof f.value === "string" &&
    typeof f.url === "string" &&
    typeof f.label === "string"
  );
}

function loadUses(): EmoteUse[] {
  const stored = storage.read(STORAGE_KEYS.emoteUsage);
  return Array.isArray(stored) ? stored.filter(isUse) : [];
}

function isUse(value: unknown): value is EmoteUse {
  if (!isFavorite(value)) return false;
  const u = value as Record<string, unknown>;
  return typeof u.count === "number" && typeof u.lastUsed === "number";
}

export function recordUse(emote: FavoriteEmote) {
  const next = withUse(emoteUses(), emote, Date.now());
  setEmoteUses(next);
  storage.write(STORAGE_KEYS.emoteUsage, next);
}

export function toggleFavorite(emote: FavoriteEmote) {
  const list = favorites();
  const next = list.some((e) => e.value === emote.value)
    ? list.filter((e) => e.value !== emote.value)
    : [...list, emote];
  setFavorites(next);
  storage.write(STORAGE_KEYS.emoteFavorites, next);
}
