import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import type { GlobalEmote, RustEmoteEntry, SevenTvChannelResult, UserEmote } from "../types";

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
