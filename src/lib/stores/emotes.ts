import { createSignal } from "solid-js";
import type { EmoteEntry } from "../types/index.ts";
import type { Emote, UserEmote } from "../types/index.ts";
import type { User } from "../types/index.ts";
import { type EmoteMap, emoteMap } from "../utils/emoteMap.ts";
import { knownUser } from "./users.ts";

export type { EmoteEntry };
export type EmoteSection = { id: string; label: string; emotes: EmoteEntry[] };
export type FavoriteEmote = { value: string; url: string; label: string };

/// The emotes service loads and saves them.
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

/// Every third-party emote by name; the emotes service keeps it current.
export const [thirdPartyEmoteMap, setThirdPartyEmoteMap] =
  createSignal<EmoteMap>(emoteMap([]));

const EMOJI = /^\p{RGI_Emoji}$/v;

/// Emoji work in every channel; emotes only where these sections offer them.
export function usableIn(sections: EmoteSection[]): (value: string) => boolean {
  const names = new Set(sections.flatMap((s) => s.emotes.map((e) => e.name)));
  return (value) => names.has(value) || EMOJI.test(value);
}

export function usableFavorites(broadcaster: User | null): FavoriteEmote[] {
  const usable = usableIn([
    ...computeChannelSections(broadcaster),
    ...computeGlobalSections(broadcaster),
  ]);
  return favorites().filter((f) => usable(f.value));
}

/// Deduplicate a list of user emotes by id. Twitch's `Get User Emotes`
/// endpoint returns the same emote once per emote-set it belongs to, so
/// callers ingesting the raw response (e.g. the cache loader) must run
/// it through here before writing the signal.
export function dedupeById(list: UserEmote[]): UserEmote[] {
  const seen = new Set<string>();
  const out: UserEmote[] = [];
  for (const e of list) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out;
}

export function clearChannelThirdPartyEmotes() {
  setSevenTvChannel([]);
  setBttvChannel([]);
  setFfzChannel([]);
}

function sortByName<T extends { name: string }>(arr: readonly T[]): T[] {
  return [...arr].sort((a, b) => a.name.localeCompare(b.name));
}

/// Builds the `User` tab sections for the emote picker: the broadcaster's
/// own Twitch emotes (deduplicated by name) followed by the channel's 7TV /
/// BTTV / FFZ sets. Reads the relevant signals internally so it can be wrapped
/// in a `createMemo` at the call site.
export function computeChannelSections(
  broadcaster: User | null,
): EmoteSection[] {
  const sections: EmoteSection[] = [];
  if (broadcaster) {
    const seen = new Map<string, string>();
    for (const e of userEmotes()) {
      if (e.ownerId !== broadcaster.id) continue;
      if (!seen.has(e.name)) seen.set(e.name, e.url);
    }
    if (seen.size) {
      sections.push({
        id: "twitch",
        label: broadcaster.displayName,
        emotes: [...seen.entries()]
          .map(([name, url]) => ({ name, url }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      });
    }
  }
  const stv = sevenTvChannel();
  if (stv.length) {
    sections.push({ id: "7tv-channel", label: "7TV", emotes: sortByName(stv) });
  }
  const bttv = bttvChannel();
  if (bttv.length) {
    sections.push({
      id: "bttv-channel",
      label: "BetterTTV",
      emotes: sortByName(bttv),
    });
  }
  const ffz = ffzChannel();
  if (ffz.length) {
    sections.push({
      id: "ffz-channel",
      label: "FrankerFaceZ",
      emotes: sortByName(ffz),
    });
  }
  return sections;
}

/// Builds the `Global` tab sections: one section per channel the user subs to
/// (using known users for display names), then global Twitch, 7TV, BTTV, FFZ.
/// Emotes already attributed to the active broadcaster are excluded.
export function computeGlobalSections(
  broadcaster: User | null,
): EmoteSection[] {
  const subGroupMap = new Map<string, EmoteEntry[]>();
  const otherEmotes = new Map<string, string>();

  for (const e of userEmotes()) {
    if (e.ownerId === broadcaster?.id) continue;
    if (
      e.emoteType === "subscriptions" &&
      e.ownerId &&
      /^\d+$/.test(e.ownerId)
    ) {
      const list = subGroupMap.get(e.ownerId) ?? [];
      list.push({ name: e.name, url: e.url });
      subGroupMap.set(e.ownerId, list);
    } else {
      otherEmotes.set(e.name, e.url);
    }
  }

  const subscriptionSections: EmoteSection[] = [...subGroupMap.entries()]
    .map(([ownerId, emotes]) => ({
      id: `channel-${ownerId}`,
      label: knownUser(ownerId)?.displayName ?? ownerId,
      emotes: sortByName(emotes),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  for (const e of globalEmotes()) {
    if (!otherEmotes.has(e.name)) otherEmotes.set(e.name, e.url);
  }
  const merged = sortByName(
    [...otherEmotes.entries()].map(([name, url]) => ({ name, url })),
  );

  const stv = sevenTvGlobal();
  const bttv = bttvGlobal();
  const ffz = ffzGlobal();
  return [
    ...subscriptionSections,
    ...(merged.length
      ? [{ id: "twitch-global", label: "Twitch Global", emotes: merged }]
      : []),
    ...(stv.length
      ? [{ id: "7tv", label: "7TV", emotes: sortByName(stv) }]
      : []),
    ...(bttv.length
      ? [{ id: "bttv", label: "BetterTTV", emotes: sortByName(bttv) }]
      : []),
    ...(ffz.length
      ? [{ id: "ffz", label: "FrankerFaceZ", emotes: sortByName(ffz) }]
      : []),
  ];
}
