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
  dedupeById,
  ffzChannel,
  ffzGlobal,
  setBttvChannel,
  setBttvGlobal,
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

const USER_EMOTES_TTL = 6 * 60 * 60 * 1000;
const GLOBAL_EMOTES_CACHE_KEY = "cache:global_emotes";
const GLOBAL_EMOTES_TTL = 24 * 60 * 60 * 1000;
const GLOBALS_RETRY_MIN_MS = 30_000;
const GLOBALS_RETRY_MAX_MS = 300_000;

const bttv = channelResource((c) =>
  bttvGetChannelEmotes({ channelId: c.id }, { silent: true }),
);
const ffz = channelResource((c) =>
  ffzGetChannelEmotes({ channelLogin: c.login }, { silent: true }),
);

let userEmotesLoadStarted = false;

export async function ensureUserLoaded(): Promise<void> {
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
}

export async function loadGlobal(): Promise<Emote[]> {
  const cached = loadCache<Emote[]>(GLOBAL_EMOTES_CACHE_KEY, GLOBAL_EMOTES_TTL);
  if (cached) {
    getGlobalEmotes({ silent: true })
      .then((fresh) => {
        saveCache(GLOBAL_EMOTES_CACHE_KEY, fresh);
        setGlobalEmotes(fresh);
      })
      .catch(() => {});
    return cached;
  }
  const fresh = await getGlobalEmotes({ silent: true });
  saveCache(GLOBAL_EMOTES_CACHE_KEY, fresh);
  return fresh;
}

/// Loads each provider's global emotes, retrying each until it succeeds,
/// and keeps the third-party emote map in step with every list.
export function start(): () => void {
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

export function resetChannelThirdParty() {
  bttv.clear();
  ffz.clear();
}
