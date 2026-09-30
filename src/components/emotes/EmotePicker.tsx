import { Search } from "lucide-solid";
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
import * as users from "../../lib/services/users.ts";
import EmoteGrid from "./EmoteGrid.tsx";
import EmotePickerSection from "./EmotePickerSection.tsx";
import Field from "../ui/Field.tsx";
import NavItem from "../ui/NavItem.tsx";
import { captureFocusForRestore } from "../../lib/utils/focus.ts";
import * as shortcuts from "../../lib/services/shortcuts.ts";
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
    if (ids.size) users.get({ ids: [...ids] });
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
        label: "Favourites",
        items: favorites().map((f) => ({
          value: f.value,
          url: f.url,
          label: f.label,
        })),
        emptyHint: "Right-click any emote to keep it here.",
      });
      for (const s of tabSections()) add(s);
    }
    return out;
  });

  const totalItems = createMemo(() =>
    sections().reduce((n, s) => n + s.items.length, 0)
  );

  const activeItem = createMemo<EmoteGridItem | undefined>(() => {
    const idx = activeIndex();
    for (const s of sections()) {
      const pos = idx - s.startIndex;
      if (pos >= 0 && pos < s.items.length) return s.items[pos];
    }
    return undefined;
  });

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
  });
  onMount(() => {
    queueMicrotask(() => searchRef?.focus());
    const unbind = shortcuts.bindScope("emotePickerOpen", {
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
    const item = activeItem();
    if (item) props.onSelect(item.value, { keepOpen });
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
        role="dialog"
        aria-label="Emotes"
        class="fixed right-4 bottom-(--bottom) z-40 w-100 h-110 max-w-full bg-overlay border border-line rounded-lg flex flex-col overflow-hidden transition duration-quick ease-out starting:opacity-0 starting:translate-y-1"
        style={{ "--bottom": `${bottomOffset()}px` }}
      >
        <div class="px-2.5 pt-2.5 pb-1.5 shrink-0">
          <Field
            size="sm"
            class="w-full"
            icon={<Search />}
            ref={(el) => (searchRef = el)}
            placeholder="Search emotes"
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
          />
        </div>
        <div class="flex px-2.5 border-b border-line-soft shrink-0">
          <For each={TABS}>
            {(t) => (
              <NavItem
                orientation="horizontal"
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
        </div>

        <div class="overflow-y-auto flex-1 px-2.5 py-1.5 flex flex-col gap-1 scrollbar-gutter-stable">
          <For each={sections()}>
            {(section) => (
              <Show when={section.label} fallback={renderGrid(section)}>
                <EmotePickerSection label={section.label!}>
                  <Show
                    when={section.items.length > 0}
                    fallback={
                      <Show when={section.emptyHint}>
                        <p class="text-small text-ink-faint px-1 py-2">
                          {section.emptyHint}
                        </p>
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

        <div class="shrink-0 h-11 flex items-center gap-2.5 px-3.5 border-t border-line-soft text-small">
          <Show
            when={activeItem()}
            fallback={
              <span class="text-ink-faint">Shift + Enter keeps this open</span>
            }
          >
            {(item) => (
              <>
                <img src={item().url} alt="" class="size-6 object-contain" />
                <span class="font-semibold text-ink truncate">
                  {item().label}
                </span>
                <span class="ml-auto text-ink-faint whitespace-nowrap">
                  Enter to insert
                </span>
              </>
            )}
          </Show>
        </div>
      </div>
    </Portal>
  );
}
