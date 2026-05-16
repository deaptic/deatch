import { createMemo, createSignal, createEffect, For, Show, onMount, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import {
  userEmotes,
  favorites,
  isFavorite,
  toggleFavorite,
  computeChannelSections,
  computeGlobalSections,
} from "../../state/emotes";
import { selectedChannel } from "../../state/channels";
import { getUsers } from "../../commands/users";
import EmoteGrid from "./EmoteGrid";
import EmoteSections from "./EmoteSections";
import EmotePickerSection from "./EmotePickerSection";
import { captureFocusForRestore } from "../../utils/focus";
import type { EmoteGridItem } from "./types";
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
  captureFocusForRestore();
  const [search, setSearch] = createSignal("");
  const [tab, setTab] = createSignal<Tab>("channel");
  let panelRef: HTMLDivElement | undefined;

  // Hydrate display metadata for any channels the user subs to whose owner
  // info isn't yet in the user cache. Used by `computeGlobalSections` to
  // label the per-channel groups.
  createEffect(() => {
    const broadcaster = selectedChannel();
    const ids = new Set<string>();
    for (const e of userEmotes()) {
      if (
        e.emote_type === "subscriptions" &&
        e.owner_id &&
        e.owner_id !== broadcaster?.user_id &&
        /^\d+$/.test(e.owner_id)
      ) {
        ids.add(e.owner_id);
      }
    }
    if (ids.size) getUsers({ userIds: [...ids] });
  });

  const channelSections = createMemo(() => computeChannelSections(selectedChannel()));
  const globalSections = createMemo(() => computeGlobalSections(selectedChannel()));

  const searchResults = (): EmoteGridItem[] => {
    const q = search().toLowerCase();
    if (!q) return [];
    return [...channelSections(), ...globalSections()].flatMap((s) =>
      s.emotes
        .filter((e) => e.name.toLowerCase().includes(q))
        .map((e) => ({ value: e.name, url: e.url, label: e.name }))
    );
  };

  const onToggleFavorite = (item: EmoteGridItem) =>
    toggleFavorite({ value: item.value, url: item.url, label: item.label });

  const onDocumentKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || e.defaultPrevented) return;
    e.preventDefault();
    props.onClose();
  };
  const onDocumentMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (panelRef?.contains(target)) return;
    if (target.closest("[data-emote-picker-toggle]")) return;
    props.onClose();
  };
  onMount(() => {
    document.addEventListener("keydown", onDocumentKeyDown);
    document.addEventListener("mousedown", onDocumentMouseDown, { capture: true });
    onCleanup(() => {
      document.removeEventListener("keydown", onDocumentKeyDown);
      document.removeEventListener("mousedown", onDocumentMouseDown, { capture: true });
    });
  });

  return (
    <Portal>
      <div ref={panelRef} class="fixed bottom-16 right-2 z-40 w-80 h-96 bg-bg border border-border-muted rounded-lg shadow-2xl flex flex-col">
        <div class="flex border-b border-border-muted shrink-0">
          <For each={TABS}>
            {(t) => (
              <button
                onClick={() => { setTab(t.id); setSearch(""); }}
                class={`flex-1 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  tab() === t.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-text-muted hover:text-text"
                }`}
              >
                {t.label}
              </button>
            )}
          </For>
        </div>

        <div class="p-2 border-b border-border-muted shrink-0">
          <input
            type="text"
            placeholder="Search emotes…"
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
            autofocus
            class="w-full bg-bg-dark text-text text-sm px-3 py-1.5 rounded outline-none placeholder-text-muted"
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
    </Portal>
  );
}
