import { bttvGetChannelEmotes, bttvGetGlobalEmotes } from "../commands/external/bttv";
import { ffzGetChannelEmotes, ffzGetGlobalEmotes } from "../commands/external/ffz";
import {
  seventvGetChannelEmotes,
  seventvGetGlobalEmotes,
} from "../commands/external/seventv";
import { seventvWatchEmoteSet } from "../commands/external/seventv_events";
import { getGlobalEmotes, getUserEmotes } from "../commands/twitch/chat";
import { fetchAllPages } from "../commands/utils";
import { appendItem } from "../state/feeds";
import {
  dedupeById,
  setBttvChannel,
  setBttvGlobal,
  setFfzChannel,
  setFfzGlobal,
  setGlobalEmotes,
  setSevenTvChannel,
  setSevenTvGlobal,
  setUserEmotes,
} from "../state/emotes";
import { user } from "../state/users";
import type { EmoteEntry } from "../types/external/emote";
import type { Delta as SevenTvUpdate } from "../types/external/seventv";
import type { Emote, UserEmote } from "../types/twitch/chat";
import type { FeedEvent } from "../types/feed";
import { loadCache, saveCache } from "../utils/cache";

export type { SevenTvUpdate };

const USER_EMOTES_TTL = 6 * 60 * 60 * 1000;
const GLOBAL_EMOTES_CACHE_KEY = "cache:global_emotes";
const GLOBAL_EMOTES_TTL = 24 * 60 * 60 * 1000;

const channelEmoteCache = new Map<string, Promise<EmoteEntry[]>>();
const sevenTvSetByChannel = new Map<string, string | null>();

let userEmotesLoadStarted = false;
let thirdPartyGlobalsLoaded = false;
let activeChannelId: string | null = null;

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

function watchSevenTvSet(setId: string | null) {
  seventvWatchEmoteSet({ emoteSetId: setId }, { silent: true }).catch(() => {});
}

function loadSevenTvChannel(channelId: string) {
  cachedChannelFetch(`stv:${channelId}`, () =>
    seventvGetChannelEmotes({ channelId }, { silent: true }).then((r) => {
      sevenTvSetByChannel.set(channelId, r.emote_set_id);
      return r.emotes;
    }),
  ).then((emotes) => {
    setSevenTvChannel(emotes);
    if (activeChannelId === channelId) {
      watchSevenTvSet(sevenTvSetByChannel.get(channelId) ?? null);
    }
  });
}

export function loadChannelThirdPartyEmotes(
  channelId: string,
  channelLogin: string,
) {
  activeChannelId = channelId;
  loadSevenTvChannel(channelId);
  cachedChannelFetch(`bttv:${channelId}`, () =>
    bttvGetChannelEmotes({ channelId }, { silent: true }),
  ).then(setBttvChannel);
  cachedChannelFetch(`ffz:${channelLogin}`, () =>
    ffzGetChannelEmotes({ channelLogin }, { silent: true }),
  ).then(setFfzChannel);
}

function applyDelta(prev: EmoteEntry[], u: SevenTvUpdate): EmoteEntry[] {
  const removed = new Set(u.removed);
  const renames = new Map(u.renamed.map((r) => [r.from, r.to] as const));
  const kept = prev
    .filter((e) => !removed.has(e.name))
    .map((e) =>
      renames.has(e.name) ? { ...e, name: renames.get(e.name)! } : e,
    );
  return [...kept, ...u.added];
}

export function applySevenTvUpdate(u: SevenTvUpdate) {
  if (!activeChannelId) return;
  if (sevenTvSetByChannel.get(activeChannelId) !== u.id) return;
  channelEmoteCache.delete(`stv:${activeChannelId}`);
  setSevenTvChannel((prev) => applyDelta(prev, u));
  announceChanges(activeChannelId, u);
}

function announceChanges(channelId: string, u: SevenTvUpdate) {
  const ts = Date.now();
  const who = u.actor ?? "Someone";
  for (const e of u.added) {
    appendItem(
      channelId,
      sevenTvEvent(ts, who, `${who} added 7TV emote ${e.name}`),
    );
  }
  for (const name of u.removed) {
    appendItem(
      channelId,
      sevenTvEvent(ts, who, `${who} removed 7TV emote ${name}`),
    );
  }
  for (const r of u.renamed) {
    appendItem(
      channelId,
      sevenTvEvent(ts, who, `${who} renamed 7TV emote ${r.from} to ${r.to}`),
    );
  }
}

function sevenTvEvent(
  timestamp: number,
  actor: string,
  message: string,
): FeedEvent {
  return {
    kind: "event",
    id: crypto.randomUUID(),
    notice_type: "seventv_update",
    system_message: message,
    chatter_name: actor,
    color: "",
    timestamp,
  };
}

export function clearActiveSevenTvSubscription() {
  activeChannelId = null;
  watchSevenTvSet(null);
}

export function resetChannelThirdPartyEmoteCache() {
  channelEmoteCache.clear();
  sevenTvSetByChannel.clear();
  clearActiveSevenTvSubscription();
}
