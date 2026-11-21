import { createSignal } from "solid-js";
import type { Emote, EmoteEntry, User, UserEmote } from "../types/index.ts";
import { type EmoteMap, emoteMap } from "../utils/emoteMap.ts";
import {
  channelSections,
  type EmoteSection,
  globalSections,
  usableIn,
} from "../utils/emoteSections.ts";
import { knownUser } from "./users.ts";

export type FavoriteEmote = { value: string; url: string; label: string };

export const [favorites, setFavorites] = createSignal<FavoriteEmote[]>([]);

export const [globalEmotes, setGlobalEmotes] = createSignal<Emote[]>([]);
export const [userEmotes, setUserEmotes] = createSignal<UserEmote[]>([]);
export const [sevenTvGlobal, setSevenTvGlobal] = createSignal<EmoteEntry[]>([]);
export const [bttvGlobal, setBttvGlobal] = createSignal<EmoteEntry[]>([]);
export const [ffzGlobal, setFfzGlobal] = createSignal<EmoteEntry[]>([]);
export const [sevenTvChannel, setSevenTvChannel] = createSignal<EmoteEntry[]>(
  [],
);
export const [bttvChannel, setBttvChannel] = createSignal<EmoteEntry[]>([]);
export const [ffzChannel, setFfzChannel] = createSignal<EmoteEntry[]>([]);

export const [thirdPartyEmoteMap, setThirdPartyEmoteMap] =
  createSignal<EmoteMap>(emoteMap([]));

export function usableFavorites(broadcaster: User | null): FavoriteEmote[] {
  const usable = usableIn([
    ...computeChannelSections(broadcaster),
    ...computeGlobalSections(broadcaster),
  ]);
  return favorites().filter((f) => usable(f.value));
}

export function clearChannelThirdPartyEmotes() {
  setSevenTvChannel([]);
  setBttvChannel([]);
  setFfzChannel([]);
}

export function computeChannelSections(
  broadcaster: User | null,
): EmoteSection[] {
  return channelSections(broadcaster, userEmotes(), {
    sevenTv: sevenTvChannel(),
    bttv: bttvChannel(),
    ffz: ffzChannel(),
  });
}

export function computeGlobalSections(
  broadcaster: User | null,
): EmoteSection[] {
  return globalSections(
    broadcaster,
    userEmotes(),
    globalEmotes(),
    { sevenTv: sevenTvGlobal(), bttv: bttvGlobal(), ffz: ffzGlobal() },
    (id) => knownUser(id)?.displayName,
  );
}
