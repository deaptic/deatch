import { createMemo, createSignal, createEffect, For, Show } from "solid-js";
import {
  globalEmotes,
  userEmotes,
  favorites,
  isFavorite,
  toggleFavorite,
  EmoteSection,
  sevenTvGlobal,
  bttvGlobal,
  ffzGlobal,
  sevenTvChannel,
  bttvChannel,
  ffzChannel,
} from "../../emotes";
import { activeBroadcaster } from "../../broadcaster";
import { userInfoCache, fetchUserInfo } from "../../users";
import EmoteGrid from "./EmoteGrid";
import EmoteSections from "./EmoteSections";
import EmotePickerSection from "./EmotePickerSection";
import type { GridItem } from "./types";
import emojiGroups from "unicode-emoji-json/data-by-group.json";

type Tab = "channel" | "global" | "emoji";

const TABS: { id: Tab; label: string }[] = [
  { id: "channel", label: "Channel" },
  { id: "global", label: "Global" },
  { id: "emoji", label: "Emoji" },
];

function emojiUrl(emoji: string): string {
  const points: string[] = [];
  for (const char of emoji) {
    const cp = char.codePointAt(0);
    if (cp !== undefined && cp !== 0xfe0f) points.push(cp.toString(16));
  }
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${points.join("-")}.png`;
}

type Props = {
  onSelect: (value: string) => void;
  onClose: () => void;
};

export default function EmotePicker(props: Props) {
  const [search, setSearch] = createSignal("");
  const [tab, setTab] = createSignal<Tab>("channel");

  createEffect(() => {
    const broadcaster = activeBroadcaster();
    const ids = new Set<string>();
    for (const e of userEmotes()) {
      if (
        e.emote_type === "subscriptions" &&
        e.owner_id &&
        e.owner_id !== broadcaster?.id &&
        /^\d+$/.test(e.owner_id)
      ) {
        ids.add(e.owner_id);
      }
    }
    if (ids.size) fetchUserInfo([...ids]);
  });

  const channelSections = createMemo<EmoteSection[]>(() => {
    const broadcaster = activeBroadcaster();
    const sections: EmoteSection[] = [];
    if (broadcaster) {
      const seen = new Map<string, string>();
      for (const e of userEmotes()) {
        if (e.owner_id !== broadcaster.id) continue;
        if (!seen.has(e.name)) {
          seen.set(e.name, `https://static-cdn.jtvnw.net/emoticons/v2/${e.id}/default/dark/1.0`);
        }
      }
      if (seen.size) {
        sections.push({
          id: "twitch",
          label: broadcaster.name,
          emotes: [...seen.entries()]
            .map(([name, url]) => ({ name, url }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        });
      }
    }
    const sortByName = <T extends { name: string }>(arr: T[]) => [...arr].sort((a, b) => a.name.localeCompare(b.name));
    const stv = sevenTvChannel();
    if (stv.length) sections.push({ id: "7tv-channel", label: "7TV", emotes: sortByName(stv) });
    const bttv = bttvChannel();
    if (bttv.length) sections.push({ id: "bttv-channel", label: "BetterTTV", emotes: sortByName(bttv) });
    const ffz = ffzChannel();
    if (ffz.length) sections.push({ id: "ffz-channel", label: "FrankerFaceZ", emotes: sortByName(ffz) });
    return sections;
  });

  const globalSections = createMemo<EmoteSection[]>(() => {
    const broadcaster = activeBroadcaster();
    const subGroupMap = new Map<string, { name: string; url: string }[]>();
    const otherEmotes = new Map<string, string>();

    for (const e of userEmotes()) {
      if (e.owner_id === broadcaster?.id) continue;
      const url = `https://static-cdn.jtvnw.net/emoticons/v2/${e.id}/default/dark/1.0`;
      if (e.emote_type === "subscriptions" && e.owner_id && /^\d+$/.test(e.owner_id)) {
        const list = subGroupMap.get(e.owner_id) ?? [];
        list.push({ name: e.name, url });
        subGroupMap.set(e.owner_id, list);
      } else {
        otherEmotes.set(e.name, url);
      }
    }

    const cache = userInfoCache();
    const subscriptionSections: EmoteSection[] = [...subGroupMap.entries()]
      .map(([ownerId, emotes]) => ({
        id: `channel-${ownerId}`,
        label: cache[ownerId]?.display_name ?? ownerId,
        emotes: [...emotes].sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    for (const e of globalEmotes()) {
      if (!otherEmotes.has(e.name)) otherEmotes.set(e.name, e.images.url_1x);
    }
    const merged = [...otherEmotes.entries()]
      .map(([name, url]) => ({ name, url }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const sortByName = <T extends { name: string }>(arr: T[]) => [...arr].sort((a, b) => a.name.localeCompare(b.name));
    const stv = sevenTvGlobal();
    const bttv = bttvGlobal();
    const ffz = ffzGlobal();
    return [
      ...subscriptionSections,
      ...(merged.length ? [{ id: "twitch-global", label: "Twitch Global", emotes: merged }] : []),
      ...(stv.length ? [{ id: "7tv", label: "7TV", emotes: sortByName(stv) }] : []),
      ...(bttv.length ? [{ id: "bttv", label: "BetterTTV", emotes: sortByName(bttv) }] : []),
      ...(ffz.length ? [{ id: "ffz", label: "FrankerFaceZ", emotes: sortByName(ffz) }] : []),
    ];
  });

  const searchResults = (): GridItem[] => {
    const q = search().toLowerCase();
    if (!q) return [];
    return [...channelSections(), ...globalSections()].flatMap((s) =>
      s.emotes
        .filter((e) => e.name.toLowerCase().includes(q))
        .map((e) => ({ value: e.name, url: e.url, label: e.name }))
    );
  };

  const onToggleFavorite = (item: GridItem) =>
    toggleFavorite({ value: item.value, url: item.url, label: item.label });

  return (
    <>
      <div class="fixed inset-0 z-10" onClick={props.onClose} />
      <div class="absolute bottom-full right-0 z-20 w-80 bg-[#1f1f23] border border-[#2d2d35] rounded-tl-lg shadow-2xl flex flex-col h-96">
        <div class="flex border-b border-[#2d2d35] shrink-0">
          <For each={TABS}>
            {(t) => (
              <button
                onClick={() => { setTab(t.id); setSearch(""); }}
                class={`flex-1 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  tab() === t.id
                    ? "text-[#9146ff] border-b-2 border-[#9146ff]"
                    : "text-[#5c5c7a] hover:text-white"
                }`}
              >
                {t.label}
              </button>
            )}
          </For>
        </div>

        <div class="p-2 border-b border-[#2d2d35] shrink-0">
          <input
            type="text"
            placeholder="Search emotes…"
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
            autofocus
            class="w-full bg-[#0e0e10] text-white text-sm px-3 py-1.5 rounded outline-none placeholder-[#5c5c7a]"
          />
        </div>

        <div class="overflow-y-auto flex-1 pl-2 pr-3 py-1 flex flex-col gap-2 [scrollbar-gutter:stable]">
          <Show when={!search() && favorites().length > 0}>
            <EmotePickerSection label="Favorites">
              <EmoteGrid
                items={favorites().map((f) => ({ value: f.value, url: f.url, label: f.label }))}
                onSelect={props.onSelect}
                isFavorite={isFavorite}
                onToggleFavorite={onToggleFavorite}
              />
            </EmotePickerSection>
          </Show>
          <Show when={search()}>
            <EmoteGrid
              items={searchResults()}
              onSelect={props.onSelect}
              isFavorite={isFavorite}
              onToggleFavorite={onToggleFavorite}
            />
          </Show>
          <Show when={!search() && tab() === "channel"}>
            <EmoteSections
              sections={channelSections()}
              onSelect={props.onSelect}
              isFavorite={isFavorite}
              onToggleFavorite={onToggleFavorite}
            />
          </Show>
          <Show when={!search() && tab() === "global"}>
            <EmoteSections
              sections={globalSections()}
              onSelect={props.onSelect}
              isFavorite={isFavorite}
              onToggleFavorite={onToggleFavorite}
            />
          </Show>
          <Show when={!search() && tab() === "emoji"}>
            <For each={emojiGroups}>
              {(group) => (
                <EmotePickerSection label={group.name}>
                  <EmoteGrid
                    items={group.emojis.map((e) => ({ value: e.emoji, url: emojiUrl(e.emoji), label: e.name }))}
                    onSelect={props.onSelect}
                    isFavorite={isFavorite}
                    onToggleFavorite={onToggleFavorite}
                  />
                </EmotePickerSection>
              )}
            </For>
          </Show>
        </div>
      </div>
    </>
  );
}
