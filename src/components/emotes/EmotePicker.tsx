import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { Portal } from "solid-js/web";
import {
  computeChannelSections,
  computeGlobalSections,
  favorites,
  isFavorite,
  toggleFavorite,
  userEmotes,
} from "../../lib/stores/emotes.ts";
import { selectedChannel } from "../../lib/stores/view.ts";
import { getUsers } from "../../lib/api/twitch/users.ts";
import EmoteGrid from "./EmoteGrid.tsx";
import EmotePickerSection from "./EmotePickerSection.tsx";
import Navigation from "../ui/Navigation.tsx";
import NavigationItem from "../ui/NavigationItem.tsx";
import { captureFocusForRestore } from "../../lib/utils/focus.ts";
import { shortcutManager } from "../../lib/managers/ShortcutManager.ts";
import { dismissOnOutside } from "../../lib/primitives/dismissOnOutside.ts";
import type { EmoteGridItem } from "./types.ts";
import {
  emojiUrl,
  nextVerticalIndex,
  type RenderSection,
  toItem,
} from "./helpers.ts";
import emojiGroups from "unicode-emoji-json/data-by-group.json" with {
  type: "json",
};

type Tab = "channel" | "global" | "emoji";

const TABS: { id: Tab; label: string }[] = [
  { id: "channel", label: "Channel" },
  { id: "global", label: "Global" },
  { id: "emoji", label: "Emoji" },
];

type Props = {
  onSelect: (value: string, opts?: { keepOpen?: boolean }) => void;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
};

export default function EmotePicker(props: Props) {
  captureFocusForRestore();
  const [search, setSearch] = createSignal("");
  const [tab, setTab] = createSignal<Tab>("channel");
  const [bottomOffset, setBottomOffset] = createSignal(64);
  const [activeIndex, setActiveIndex] = createSignal(0);
  let panelRef: HTMLDivElement | undefined;
  let searchRef: HTMLInputElement | undefined;

  // Hydrate display metadata for any channels the user subs to whose owner
  // info isn't yet in the user cache. Used by `computeGlobalSections` to
  // label the per-channel groups.
  createEffect(() => {
    const broadcaster = selectedChannel();
    const ids = new Set<string>();
    for (const e of userEmotes()) {
      if (
        e.emoteType === "subscriptions" &&
        e.ownerId &&
        e.ownerId !== broadcaster?.id &&
        /^\d+$/.test(e.ownerId)
      ) {
        ids.add(e.ownerId);
      }
    }
    if (ids.size) getUsers({ ids: [...ids] });
  });

  const channelSections = createMemo(() =>
    computeChannelSections(selectedChannel())
  );
  const globalSections = createMemo(() =>
    computeGlobalSections(selectedChannel())
  );

  const tabSections = createMemo<{ label: string; items: EmoteGridItem[] }[]>(
    () => {
      if (tab() === "channel") {
        return channelSections().map((s) => ({
          label: s.label,
          items: s.emotes.map(toItem),
        }));
      }
      if (tab() === "global") {
        return globalSections().map((s) => ({
          label: s.label,
          items: s.emotes.map(toItem),
        }));
      }
      return emojiGroups.map((g) => ({
        label: g.name,
        items: g.emojis.map((e) => ({
          value: e.emoji,
          url: emojiUrl(e.emoji),
          label: e.name,
        })),
      }));
    },
  );

  const sections = createMemo<RenderSection[]>(() => {
    let offset = 0;
    const out: RenderSection[] = [];
    const add = (s: Omit<RenderSection, "startIndex">) => {
      out.push({ ...s, startIndex: offset });
      offset += s.items.length;
    };
    const q = search().toLowerCase();
    if (q) {
      add({
        items: [...channelSections(), ...globalSections()].flatMap((s) =>
          s.emotes.filter((e) => e.name.toLowerCase().includes(q)).map(toItem)
        ),
      });
    } else {
      add({
        label: "Favorites",
        items: favorites().map((f) => ({
          value: f.value,
          url: f.url,
          label: f.label,
        })),
        emptyHint: "Right-click any emote to add it as a favorite.",
      });
      for (const s of tabSections()) add(s);
    }
    return out;
  });

  const totalItems = createMemo(() =>
    sections().reduce((n, s) => n + s.items.length, 0)
  );

  createEffect(() => {
    tab();
    search();
    setActiveIndex(0);
  });

  createEffect(() => {
    setActiveIndex((idx) => Math.min(idx, Math.max(0, totalItems() - 1)));
  });

  createEffect(() => {
    const idx = activeIndex();
    queueMicrotask(() => {
      panelRef
        ?.querySelector<HTMLElement>(`[data-emote-index="${idx}"]`)
        ?.scrollIntoView({ block: "nearest" });
    });
  });

  const onToggleFavorite = (item: EmoteGridItem) =>
    toggleFavorite({ value: item.value, url: item.url, label: item.label });

  dismissOnOutside({
    ref: () => panelRef,
    onDismiss: props.onClose,
    ignoreSelector: '[data-panel-toggle="emotePicker"]',
  });
  onMount(() => {
    queueMicrotask(() => searchRef?.focus());
    const unbind = shortcutManager.bindScope("emotePickerOpen", {
      left: () => {
        setActiveIndex(Math.max(activeIndex() - 1, 0));
      },
      right: () => {
        setActiveIndex(Math.min(activeIndex() + 1, totalItems() - 1));
      },
      up: () => moveVertical(-1),
      down: () => moveVertical(1),
      tab: () => cycleTab(1),
      "shift-tab": () => cycleTab(-1),
      enter: () => selectActive(false),
      "shift-enter": () => selectActive(true),
    });
    onCleanup(() => {
      unbind();
    });

    const anchor = props.anchorEl;
    if (!anchor) return;
    const update = () => {
      const rect = anchor.getBoundingClientRect();
      setBottomOffset(window.innerHeight - rect.top + 8);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(anchor);
    window.addEventListener("resize", update);
    onCleanup(() => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    });
  });

  function cycleTab(direction: 1 | -1) {
    const idx = TABS.findIndex((t) => t.id === tab());
    setTab(TABS[(idx + direction + TABS.length) % TABS.length].id);
    setSearch("");
  }

  function moveVertical(direction: 1 | -1) {
    setActiveIndex(nextVerticalIndex(sections(), activeIndex(), direction));
  }

  function selectActive(keepOpen: boolean) {
    const secs = sections();
    for (const s of secs) {
      const pos = activeIndex() - s.startIndex;
      if (pos >= 0 && pos < s.items.length) {
        props.onSelect(s.items[pos].value, { keepOpen });
        return;
      }
    }
  }

  const renderGrid = (section: RenderSection) => (
    <EmoteGrid
      items={section.items}
      onSelect={(value, idx, opts) => {
        setActiveIndex(idx);
        props.onSelect(value, opts);
      }}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      startIndex={section.startIndex}
      activeIndex={activeIndex()}
    />
  );

  return (
    <Portal>
      <div
        ref={panelRef}
        class="fixed right-2 z-40 w-80 h-96 bg-bg-dark border border-border-muted rounded-lg shadow-2xl flex flex-col"
        style={{ bottom: `${bottomOffset()}px` }}
      >
        <Navigation fill class="border-b border-border-muted shrink-0">
          <For each={TABS}>
            {(t) => (
              <NavigationItem
                label={t.label}
                active={tab() === t.id}
                onClick={() => {
                  setTab(t.id);
                  setSearch("");
                  searchRef?.focus();
                }}
              />
            )}
          </For>
        </Navigation>

        <div class="p-2 border-b border-border-muted shrink-0">
          <input
            ref={searchRef}
            type="text"
            placeholder="Search emotes…"
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
            class="w-full bg-bg-dark text-text text-sm px-3 py-1.5 rounded outline-none placeholder-text-muted"
          />
        </div>

        <div class="overflow-y-auto flex-1 pl-2 pr-3 py-1 flex flex-col gap-2 scrollbar-gutter-stable">
          <For each={sections()}>
            {(section) => (
              <Show when={section.label} fallback={renderGrid(section)}>
                <EmotePickerSection label={section.label!}>
                  <Show
                    when={section.items.length > 0}
                    fallback={
                      <Show when={section.emptyHint}>
                        <div class="text-text-muted text-xs px-2 py-2 text-center">
                          {section.emptyHint}
                        </div>
                      </Show>
                    }
                  >
                    {renderGrid(section)}
                  </Show>
                </EmotePickerSection>
              </Show>
            )}
          </For>
        </div>
      </div>
    </Portal>
  );
}
