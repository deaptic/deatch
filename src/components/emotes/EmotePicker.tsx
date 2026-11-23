import { Clock, Search, Smile, Star } from "lucide-solid";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import {
  computeChannelSections,
  computeGlobalSections,
  favorites,
  emoteUses,
  usableUserEmotes,
} from "../../lib/stores/emotes.ts";
import { usableIn } from "../../lib/utils/emoteSections.ts";
import { mostUsed } from "../../lib/utils/emoteUsage.ts";
import { selectedChannel } from "../../lib/stores/view.ts";
import * as users from "../../lib/services/users.ts";
import * as emotes from "../../lib/services/emotes.ts";
import EmoteGrid from "./EmoteGrid.tsx";
import EmotePickerSection from "./EmotePickerSection.tsx";
import ProviderIcon, { providerOf } from "./ProviderIcon.tsx";
import RailButton from "./RailButton.tsx";
import {
  indexSections,
  itemAt,
  matchingItems,
  mergeProviders,
  type PickerSection,
  providerScope,
} from "./sections.ts";
import Field from "../../kit/Field.tsx";
import IconButton from "../../kit/IconButton.tsx";
import * as shortcuts from "../../shared/keyboard/shortcuts.ts";
import ComposerPanel from "../../kit/ComposerPanel.tsx";
import { createListNavigation } from "../../shared/solid/createListNavigation.ts";
import type { EmoteGridItem } from "./types.ts";
import { COLUMNS, emojiUrl, nextVerticalIndex, toItem } from "./helpers.ts";
import emojiGroups from "unicode-emoji-json/data-by-group.json" with { type: "json" };
import { t } from "../../shared/i18n/index.ts";
import { autofocus } from "../../shared/solid/focus.ts";
import { isUserId } from "../../lib/utils/knownUsers.ts";
import { knownUser } from "../../lib/stores/users.ts";

const EMOJI_SECTIONS: PickerSection[] = emojiGroups.map((g) => ({
  id: `emoji-${g.slug}`,
  label: g.name,
  items: g.emojis.map((e): EmoteGridItem => ({
    value: e.emoji,
    url: emojiUrl(e.emoji),
    label: e.name,
  })),
}));
const ALIGN_FRAMES = 12;
const SAVED = new Set(["favorites", "frequent"]);
const EMOJI_ITEMS = EMOJI_SECTIONS.flatMap((s) => s.items);

type Props = {
  onSelect: (value: string, opts?: { keepOpen?: boolean }) => void;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
};

export default function EmotePicker(props: Props) {
  const [search, setSearch] = createSignal("");
  const [keyboard, setKeyboard] = createSignal(false);
  const [current, setCurrent] = createSignal<string | null>(null);
  const [emojiView, setEmojiView] = createSignal(false);
  const byKeys = (run: () => void) => () => {
    setKeyboard(true);
    run();
  };
  let panelRef: HTMLDivElement | undefined;
  let listRef: HTMLDivElement | undefined;
  let railRef: HTMLElement | undefined;

  createEffect(() => {
    const broadcaster = selectedChannel();
    const ids = new Set<string>();
    for (const e of usableUserEmotes()) {
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

  const emoteSections = createMemo<PickerSection[]>(() =>
    mergeProviders(
      [...channelSections(), ...globalSections()].map((s) => {
        const scope = providerScope(s.id);
        return {
          id: s.id,
          label: s.label,
          items: s.emotes.map((e) =>
            scope ? { ...toItem(e), scope } : toItem(e),
          ),
        };
      }),
    ).map((s) => {
      const provider = providerOf(s.id);
      return {
        ...s,
        icon: provider ? () => <ProviderIcon provider={provider} /> : undefined,
      };
    }),
  );

  const saved = (
    id: string,
    label: string,
    icon: () => JSX.Element,
    empty: string,
    list: readonly EmoteGridItem[],
  ): PickerSection => ({
    id,
    label,
    icon,
    empty,
    items: list.map((f) => ({ ...f, disabled: !usable()(f.value) })),
  });

  const browseSections = createMemo<PickerSection[]>(() => [
    saved(
      "favorites",
      t("EMOTES_FAVORITES_TITLE"),
      () => <Star />,
      t("EMOTES_FAVORITES_EMPTY"),
      favorites(),
    ),
    saved(
      "frequent",
      t("EMOTES_FREQUENT_TITLE"),
      () => <Clock />,
      t("EMOTES_FREQUENT_EMPTY"),
      mostUsed(emoteUses()),
    ),
    ...emoteSections(),
  ]);

  const viewSections = () => (emojiView() ? EMOJI_SECTIONS : browseSections());

  createEffect(on(emojiView, () => setActiveIndex(0), { defer: true }));

  const sections = createMemo(() =>
    indexSections(
      search()
        ? [
            {
              id: "search",
              items: matchingItems(
                [...emoteSections().flatMap((s) => s.items), ...EMOJI_ITEMS],
                search(),
              ),
            },
          ]
        : viewSections(),
    ),
  );

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

  const activeItem = createMemo(() => itemAt(sections(), activeIndex()));

  createEffect(on(search, () => setActiveIndex(0), { defer: true }));

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

  const sectionEl = (id: string) =>
    listRef?.querySelector<HTMLElement>(`[data-section-id="${id}"]`);

  function jumpTo(id: string) {
    const list = listRef;
    if (!list) return;
    let frame = 0;
    const align = () => {
      const el = sectionEl(id);
      if (!el) return;
      const top = Math.min(el.offsetTop, list.scrollHeight - list.clientHeight);
      if (Math.abs(list.scrollTop - top) >= 1) list.scrollTop = top;
      if (++frame < ALIGN_FRAMES) requestAnimationFrame(align);
    };
    align();
  }

  function trackCurrent() {
    if (!listRef) return;
    const top = listRef.scrollTop + 1;
    let found: string | null = null;
    for (const s of sections()) {
      const el = sectionEl(s.id);
      if (el && el.offsetTop <= top) found = s.id;
    }
    setCurrent(found ?? sections()[0]?.id ?? null);
  }
  createEffect(on(sections, () => queueMicrotask(trackCurrent)));
  createEffect(
    on(current, (id) =>
      railRef
        ?.querySelector(`[data-rail-id="${id}"]`)
        ?.scrollIntoView({ block: "nearest" }),
    ),
  );

  function cycleSection(direction: 1 | -1) {
    const list = sections().filter((s) => s.items.length);
    const at = list.findIndex(
      (s) =>
        activeIndex() >= s.startIndex &&
        activeIndex() < s.startIndex + s.items.length,
    );
    const next = list[(at + direction + list.length) % list.length];
    if (!next) return;
    setActiveIndex(next.startIndex);
    jumpTo(next.id);
  }

  onMount(() => {
    const unbind = shortcuts.bindScope("emotePickerOpen", {
      left: byKeys(() => move(-1)),
      right: byKeys(() => move(1)),
      up: byKeys(() => moveVertical(-1)),
      down: byKeys(() => moveVertical(1)),
      tab: byKeys(() => cycleSection(1)),
      "shift-tab": byKeys(() => cycleSection(-1)),
      enter: () => selectActive(false),
    });
    const unbindActions = [
      shortcuts.register(
        "emotePicker::insertKeepOpen",
        () => selectActive(true),
        "emotePickerOpen",
      ),
      shortcuts.register(
        "emotePicker::favorite",
        () => {
          const item = activeItem();
          if (item) onToggleFavorite(item);
        },
        "emotePickerOpen",
      ),
    ];
    onCleanup(() => {
      unbind();
      for (const u of unbindActions) u();
    });
  });

  function moveVertical(direction: 1 | -1) {
    setActiveIndex(nextVerticalIndex(sections(), activeIndex(), direction));
  }

  function choose(item: EmoteGridItem, keepOpen: boolean) {
    emotes.recordUse({ value: item.value, url: item.url, label: item.label });
    props.onSelect(item.value, { keepOpen });
  }

  function selectActive(keepOpen: boolean) {
    const item = activeItem();
    if (item && !item.disabled) choose(item, keepOpen);
  }

  const avatarOf = (id: string) => {
    if (id === "twitch") return selectedChannel()?.profileImageUrl;
    if (id.startsWith("channel-")) {
      return knownUser(id.slice("channel-".length))?.profileImageUrl;
    }
    return undefined;
  };
  const railImage = (section: PickerSection) =>
    avatarOf(section.id) ?? section.items[0]?.url;

  const jumpable = () =>
    viewSections().filter((s) => s.label && (s.items.length || s.empty));

  function toggleEmoji() {
    setSearch("");
    setEmojiView((on) => !on);
    queueMicrotask(() => listRef?.scrollTo({ top: 0 }));
  }

  const sourceOf = createMemo(() => {
    const map = new Map<
      string,
      { section: PickerSection; item: EmoteGridItem }
    >();
    for (const section of [...browseSections(), ...EMOJI_SECTIONS]) {
      if (SAVED.has(section.id)) continue;
      for (const item of section.items) {
        if (!map.has(item.value)) map.set(item.value, { section, item });
      }
    }
    return map;
  });

  function sourceText(
    from: { section: PickerSection; item: EmoteGridItem } | undefined,
  ) {
    const label = from?.section.label;
    if (!label) return "";
    const scope = from.item.scope;
    return scope
      ? t("EMOTES_SOURCE_SCOPED_HINT", { source: label, scope })
      : t("EMOTES_SOURCE_HINT", { source: label });
  }

  function SectionIcon(props: { section: PickerSection }) {
    return (
      <Show
        when={props.section.icon}
        fallback={
          <img
            src={railImage(props.section)}
            alt=""
            loading="lazy"
            class={
              avatarOf(props.section.id)
                ? "size-8 rounded-xs object-cover"
                : "size-7 object-contain"
            }
          />
        }
      >
        {(icon) => icon()()}
      </Show>
    );
  }

  function openSection(id: string) {
    if (!search()) return jumpTo(id);
    setSearch("");
    queueMicrotask(() => jumpTo(id));
  }

  return (
    <ComposerPanel
      side="end"
      label={t("EMOTES_PICKER_LABEL")}
      anchorEl={props.anchorEl}
      onClose={props.onClose}
      size="picker"
      ref={(el) => (panelRef = el)}
    >
      <div class="px-3 pt-3 pb-3 shrink-0 flex gap-2">
        <Field
          size="lg"
          class="flex-1 min-w-0"
          icon={<Search />}
          ref={autofocus}
          placeholder={t("EMOTES_SEARCH_PLACEHOLDER")}
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
        />
        <IconButton
          label={t("EMOTES_EMOJI_LABEL")}
          size="lg"
          variant="toggle"
          pressed={emojiView()}
          onClick={toggleEmoji}
        >
          <Smile class="size-5" />
        </IconButton>
      </div>
      <div class="flex-1 min-h-0 flex border-t border-line-soft">
        <Show when={jumpable().length}>
          <nav
            ref={railRef}
            class="shrink-0 w-14 py-2 flex flex-col items-center gap-1.5 overflow-y-auto scrollbar-none border-r border-line"
          >
            <For each={jumpable()}>
              {(section) => (
                <RailButton
                  id={section.id}
                  label={section.label ?? ""}
                  active={!search() && current() === section.id}
                  onClick={() => openSection(section.id)}
                >
                  <SectionIcon section={section} />
                </RailButton>
              )}
            </For>
          </nav>
        </Show>
        <div
          ref={listRef}
          onScroll={trackCurrent}
          class="relative overflow-y-auto flex-1 min-w-0 px-2 pb-1.5 flex flex-col scrollbar-gutter-stable"
        >
          <For each={sections()}>
            {(section) => (
              <EmotePickerSection
                id={section.id}
                label={section.label}
                rows={Math.ceil(section.items.length / COLUMNS)}
                empty={section.empty}
              >
                <EmoteGrid
                  items={section.items}
                  onSelect={(_value, idx, opts) => {
                    setActiveIndex(idx);
                    const item = itemAt(sections(), idx);
                    if (item) choose(item, opts?.keepOpen ?? false);
                  }}
                  onToggleFavorite={onToggleFavorite}
                  onHover={(idx) => {
                    setKeyboard(false);
                    setActiveIndex(idx);
                  }}
                  startIndex={section.startIndex}
                  activeIndex={activeIndex()}
                  keyboard={keyboard()}
                />
              </EmotePickerSection>
            )}
          </For>
        </div>
      </div>

      <div class="shrink-0 h-14 flex items-center gap-3 px-3.5 border-t border-line-soft">
        <Show
          when={activeItem()}
          fallback={
            <span class="text-small text-ink-faint">
              {t("EMOTES_KEEP_OPEN_HINT")}
            </span>
          }
        >
          {(item) => {
            const source = () => sourceOf().get(item().value);
            return (
              <>
                <img src={item().url} alt="" class="size-8 object-contain" />
                <span class="flex-1 min-w-0 flex flex-col">
                  <span class="text-body font-semibold text-ink truncate">
                    {item().label}
                  </span>
                  <span class="text-small text-ink-faint truncate">
                    {item().disabled
                      ? t("EMOTES_UNAVAILABLE_HINT")
                      : sourceText(source())}
                  </span>
                </span>
                <Show when={source()?.section}>
                  {(from) => (
                    <span class="shrink-0 size-8 grid place-items-center text-ink-soft [&>svg]:size-5">
                      <SectionIcon section={from()} />
                    </span>
                  )}
                </Show>
              </>
            );
          }}
        </Show>
      </div>
    </ComposerPanel>
  );
}
