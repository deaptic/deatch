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
import { type ChannelRef, channelResource } from "./channelResource.ts";
import type { Emote, UserEmote } from "../types/index.ts";
import { loadCache, saveCache } from "../utils/cache.ts";

const USER_EMOTES_TTL = 6 * 60 * 60 * 1000;
const GLOBAL_EMOTES_CACHE_KEY = "cache:global_emotes";
const GLOBAL_EMOTES_TTL = 24 * 60 * 60 * 1000;

const bttv = channelResource((c) =>
  bttvGetChannelEmotes({ channelId: c.id }, { silent: true })
);
const ffz = channelResource((c) =>
  ffzGetChannelEmotes({ channelLogin: c.login }, { silent: true })
);

let userEmotesLoadStarted = false;
let thirdPartyGlobalsLoaded = false;

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
    const all = await getUserEmotes();
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

export function loadThirdPartyGlobal() {
  if (thirdPartyGlobalsLoaded) return;
  thirdPartyGlobalsLoaded = true;
  seventvGetGlobalEmotes({ silent: true }).then(setSevenTvGlobal).catch(
    () => {},
  );
  bttvGetGlobalEmotes({ silent: true }).then(setBttvGlobal).catch(() => {});
  ffzGetGlobalEmotes({ silent: true }).then(setFfzGlobal).catch(() => {});
}

export function loadChannelThirdParty(channel: ChannelRef) {
  bttv.show(channel, setBttvChannel);
  ffz.show(channel, setFfzChannel);
}

export function resetChannelThirdParty() {
  bttv.clear();
  ffz.clear();
}
