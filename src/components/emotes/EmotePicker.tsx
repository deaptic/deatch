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
import {
  computeChannelSections,
  computeGlobalSections,
  favorites,
  usableIn,
  userEmotes,
} from "../../lib/stores/emotes.ts";
import { selectedChannel } from "../../lib/stores/view.ts";
import * as users from "../../lib/services/users.ts";
import * as emotes from "../../lib/services/emotes.ts";
import EmoteGrid from "./EmoteGrid.tsx";
import EmotePickerSection from "./EmotePickerSection.tsx";
import Field from "../ui/Field.tsx";
import NavItem from "../ui/NavItem.tsx";
import * as shortcuts from "../../lib/services/shortcuts.ts";
import ComposerPanel from "../ui/ComposerPanel.tsx";
import { createListNavigation } from "../../lib/reactive/createListNavigation.ts";
import type { EmoteGridItem } from "./types.ts";
import {
  emojiUrl,
  nextVerticalIndex,
  type RenderSection,
  toItem,
} from "./helpers.ts";
import emojiGroups from "unicode-emoji-json/data-by-group.json" with { type: "json" };
import { type MessageKey, t } from "../../lib/i18n/index.ts";
import { at } from "../../lib/utils/at.ts";
import { autofocus } from "../../lib/reactive/focus.ts";
import { isUserId } from "../../lib/utils/knownUsers.ts";

type Tab = "channel" | "global" | "emoji";

const TABS: { id: Tab; label: MessageKey }[] = [
  { id: "channel", label: "EMOTES_TAB_CHANNEL" },
  { id: "global", label: "EMOTES_TAB_GLOBAL" },
  { id: "emoji", label: "EMOTES_TAB_EMOJI" },
];

type Props = {
  onSelect: (value: string, opts?: { keepOpen?: boolean }) => void;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
};

export default function EmotePicker(props: Props) {
  const [search, setSearch] = createSignal("");
  const [tab, setTab] = createSignal<Tab>("channel");
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
        isUserId(e.ownerId)
      ) {
        ids.add(e.ownerId);
      }
    }
    if (ids.size) users.get([...ids]).catch(() => {});
  });

  const channelSections = createMemo(() =>
    computeChannelSections(selectedChannel()),
  );
  const globalSections = createMemo(() =>
    computeGlobalSections(selectedChannel()),
  );

  const usable = createMemo(() =>
    usableIn([...channelSections(), ...globalSections()]),
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
      const pool =
        tab() === "emoji"
          ? tabSections().flatMap((s) => s.items)
          : [...channelSections(), ...globalSections()].flatMap((s) =>
              s.emotes.map(toItem),
            );
      add({ items: pool.filter((i) => i.label.toLowerCase().includes(q)) });
    } else {
      add({
        label: t("EMOTES_FAVOURITES"),
        items: favorites().map((f) => ({
          value: f.value,
          url: f.url,
          label: f.label,
          disabled: !usable()(f.value),
        })),
        emptyHint: t("EMOTES_FAVOURITES_EMPTY"),
      });
      for (const s of tabSections()) add(s);
    }
    return out;
  });

  const totalItems = createMemo(() =>
    sections().reduce((n, s) => n + s.items.length, 0),
  );
  const {
    active: activeIndex,
    setActive: setActiveIndex,
    move,
  } = createListNavigation({
    count: totalItems,
    rowAt: (i) => panelRef?.querySelector(`[data-emote-index="${i}"]`),
  });

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

  // Favourites lead the list, so a cursor past them moves by however much
  // they grew or shrank to stay on the same emote.
  const onToggleFavorite = (item: EmoteGridItem) => {
    const before = favorites().length;
    emotes.toggleFavorite({
      value: item.value,
      url: item.url,
      label: item.label,
    });
    if (!search() && activeIndex() >= before) {
      setActiveIndex((i) => i + favorites().length - before);
    }
  };

  onMount(() => {
    const unbind = shortcuts.bindScope("emotePickerOpen", {
      left: () => move(-1),
      right: () => move(1),
      up: () => moveVertical(-1),
      down: () => moveVertical(1),
      tab: () => cycleTab(1),
      "shift-tab": () => cycleTab(-1),
      enter: () => selectActive(false),
      "shift-enter": () => selectActive(true),
      "ctrl-d": () => {
        const item = activeItem();
        if (item) onToggleFavorite(item);
      },
    });
    onCleanup(() => {
      unbind();
    });
  });

  function cycleTab(direction: 1 | -1) {
    const idx = TABS.findIndex((entry) => entry.id === tab());
    setTab(at(TABS, (idx + direction + TABS.length) % TABS.length).id);
    setSearch("");
  }

  function moveVertical(direction: 1 | -1) {
    setActiveIndex(nextVerticalIndex(sections(), activeIndex(), direction));
  }

  function selectActive(keepOpen: boolean) {
    const item = activeItem();
    if (item && !item.disabled) props.onSelect(item.value, { keepOpen });
  }

  const renderGrid = (section: RenderSection) => (
    <EmoteGrid
      items={section.items}
      onSelect={(value, idx, opts) => {
        setActiveIndex(idx);
        props.onSelect(value, opts);
      }}
      onToggleFavorite={onToggleFavorite}
      onHover={setActiveIndex}
      startIndex={section.startIndex}
      activeIndex={activeIndex()}
    />
  );

  return (
    <ComposerPanel
      label={t("EMOTES_LABEL")}
      anchorEl={props.anchorEl}
      onClose={props.onClose}
      size="picker"
      ref={(el) => (panelRef = el)}
    >
      <div class="px-2.5 pt-2.5 pb-1.5 shrink-0">
        <Field
          size="sm"
          class="w-full"
          icon={<Search />}
          ref={(el) => {
            searchRef = el;
            autofocus(el);
          }}
          placeholder={t("EMOTES_SEARCH")}
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
        />
      </div>
      <div class="flex px-2.5 border-b border-line-soft shrink-0">
        <For each={TABS}>
          {(entry) => (
            <NavItem
              orientation="horizontal"
              label={t(entry.label)}
              active={tab() === entry.id}
              onClick={() => {
                setTab(entry.id);
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
              {(label) => (
                <EmotePickerSection label={label()}>
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
              )}
            </Show>
          )}
        </For>
      </div>

      <div class="shrink-0 h-11 flex items-center gap-2.5 px-3.5 border-t border-line-soft text-small">
        <Show
          when={activeItem()}
          fallback={<span class="text-ink-faint">{t("EMOTES_KEEP_OPEN")}</span>}
        >
          {(item) => (
            <>
              <img src={item().url} alt="" class="size-6 object-contain" />
              <span class="font-semibold text-ink truncate">
                {item().label}
              </span>
              <span class="ml-auto text-ink-faint whitespace-nowrap">
                {item().disabled
                  ? t("EMOTES_HINT_UNAVAILABLE")
                  : t("EMOTES_HINT_AVAILABLE")}
              </span>
            </>
          )}
        </Show>
      </div>
    </ComposerPanel>
  );
}
