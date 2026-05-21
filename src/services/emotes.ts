import { invoke } from "@tauri-apps/api/core";
import { streamUserEmotes, getGlobalEmotes } from "../commands/chat";
import type { FeedEvent, GlobalEmote, UserEmote } from "../types";
import { loadCache, saveCache } from "../utils/cache";
import { appendItem } from "../state/feeds";
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

type SevenTvChannelResult = {
  emotes: EmoteEntry[];
  emote_set_id: string | null;
};
type EmoteSetter = (emotes: EmoteEntry[]) => void;

export type SevenTvUpdate = {
  id: string;
  actor: string | null;
  added: EmoteEntry[];
  removed: string[];
  renamed: { from: string; to: string }[];
};

const USER_EMOTES_TTL = 6 * 60 * 60 * 1000;
const GLOBAL_EMOTES_CACHE_KEY = "cache:global_emotes";
const GLOBAL_EMOTES_TTL = 24 * 60 * 60 * 1000;

const THIRD_PARTY_GLOBALS: ReadonlyArray<[string, EmoteSetter]> = [
  ["seventv_get_global_emotes", setSevenTvGlobal],
  ["bttv_get_global_emotes", setBttvGlobal],
  ["ffz_get_global_emotes", setFfzGlobal],
];

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
    await streamUserEmotes();
    saveCache(key, userEmotes());
  } catch {
    userEmotesLoadStarted = false;
  }
}

export function resetUserEmotes() {
  setUserEmotes([]);
  userEmotesLoadStarted = false;
}

export async function loadGlobalEmotes(): Promise<GlobalEmote[]> {
  const cached = loadCache<GlobalEmote[]>(
    GLOBAL_EMOTES_CACHE_KEY,
    GLOBAL_EMOTES_TTL,
  );
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
  for (const [cmd, set] of THIRD_PARTY_GLOBALS) {
    invoke<EmoteEntry[]>(cmd)
      .then(set)
      .catch(() => {});
  }
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
  invoke("seventv_watch_emote_set", { emoteSetId: setId }).catch(() => {});
}

function loadSevenTvChannel(channelId: string) {
  cachedChannelFetch(`stv:${channelId}`, () =>
    invoke<SevenTvChannelResult>("seventv_get_channel_emotes", {
      channelId,
    }).then((r) => {
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
    invoke<EmoteEntry[]>("bttv_get_channel_emotes", { channelId }),
  ).then(setBttvChannel);
  cachedChannelFetch(`ffz:${channelLogin}`, () =>
    invoke<EmoteEntry[]>("ffz_get_channel_emotes", { channelLogin }),
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
