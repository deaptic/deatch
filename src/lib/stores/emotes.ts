import { createSignal } from "solid-js";
import type { Emote, EmoteEntry, User, UserEmote } from "../types/index.ts";
import { type EmoteMap, emoteMap } from "../utils/emoteMap.ts";
import {
  channelSections,
  dedupeById,
  type EmoteSection,
  globalSections,
  usableIn,
} from "../utils/emoteSections.ts";
import { knownUser } from "./users.ts";

export type { EmoteUse } from "../utils/emoteUsage.ts";
import type { EmoteUse } from "../utils/emoteUsage.ts";

export type FavoriteEmote = { value: string; url: string; label: string };

export const [favorites, setFavorites] = createSignal<FavoriteEmote[]>([]);
export const [emoteUses, setEmoteUses] = createSignal<EmoteUse[]>([]);

export const [globalEmotes, setGlobalEmotes] = createSignal<Emote[]>([]);
export const [userEmotes, setUserEmotes] = createSignal<UserEmote[]>([]);
export const [followerEmotes, setFollowerEmotes] = createSignal<UserEmote[]>(
  [],
);

export function usableUserEmotes(): UserEmote[] {
  return dedupeById([...userEmotes(), ...followerEmotes()]);
}
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

export function clearChannelEmotes() {
  setFollowerEmotes([]);
  setSevenTvChannel([]);
  setBttvChannel([]);
  setFfzChannel([]);
}

export function computeChannelSections(
  broadcaster: User | null,
): EmoteSection[] {
  return channelSections(broadcaster, usableUserEmotes(), {
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
    usableUserEmotes(),
    globalEmotes(),
    { sevenTv: sevenTvGlobal(), bttv: bttvGlobal(), ffz: ffzGlobal() },
    (id) => knownUser(id)?.displayName,
  );
}
