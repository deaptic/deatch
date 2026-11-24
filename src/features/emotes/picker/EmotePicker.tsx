import { Search, Smile } from "lucide-solid";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { favorites } from "../store.ts";
import { selectedChannel } from "../../navigation/index.ts";
import { knownUser } from "../../users/index.ts";
import * as emotes from "../load.ts";
import EmoteGrid from "./ui/EmoteGrid.tsx";
import Section from "./ui/Section.tsx";
import SectionIcon from "./ui/SectionIcon.tsx";
import Preview from "./ui/Preview.tsx";
import RailButton from "./ui/RailButton.tsx";
import {
  indexSections,
  itemAt,
  matchingItems,
  type PickerSection,
} from "./sections.ts";
import {
  createPickerSections,
  type ItemSource,
} from "./createPickerSections.ts";
import { createSectionScroll } from "./createSectionScroll.ts";
import { EMOJI_ITEMS, EMOJI_SECTIONS } from "./emoji.ts";
import Field from "../../../kit/Field.tsx";
import IconButton from "../../../kit/IconButton.tsx";
import * as shortcuts from "../../../shared/keyboard/shortcuts.ts";
import ComposerPanel from "../../../kit/ComposerPanel.tsx";
import { createListNavigation } from "../../../shared/solid/createListNavigation.ts";
import type { EmoteGridItem } from "./types.ts";
import { COLUMNS, nextVerticalIndex } from "./helpers.ts";
import { t } from "../../../shared/i18n/index.ts";
import { autofocus } from "../../../shared/solid/focus.ts";

type Props = {
  onSelect: (value: string, opts?: { keepOpen?: boolean }) => void;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
};

function sourceText(from: ItemSource | undefined): string {
  const label = from?.section.label;
  if (!label) return "";
  const scope = from.item.scope;
  return scope
    ? t("EMOTES_SOURCE_SCOPED_HINT", { source: label, scope })
    : t("EMOTES_SOURCE_HINT", { source: label });
}

export default function EmotePicker(props: Props) {
  const [search, setSearch] = createSignal("");
  const [keyboard, setKeyboard] = createSignal(false);
  const [emojiView, setEmojiView] = createSignal(false);
  const byKeys = (run: () => void) => () => {
    setKeyboard(true);
    run();
  };
  let panelRef: HTMLDivElement | undefined;

  const { emoteSections, browseSections, sourceOf } = createPickerSections();
  const viewSections = () => (emojiView() ? EMOJI_SECTIONS : browseSections());

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
  const scroll = createSectionScroll(sections);

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

  createEffect(on(emojiView, () => setActiveIndex(0), { defer: true }));
  createEffect(on(search, () => setActiveIndex(0), { defer: true }));

  const toggleFavorite = (item: EmoteGridItem) => {
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
    scroll.jumpTo(next.id);
  }

  function choose(item: EmoteGridItem, keepOpen: boolean) {
    emotes.recordUse({ value: item.value, url: item.url, label: item.label });
    props.onSelect(item.value, { keepOpen });
  }

  function selectActive(keepOpen: boolean) {
    const item = activeItem();
    if (item && !item.disabled) choose(item, keepOpen);
  }

  onMount(() => {
    const stops = [
      shortcuts.bindScope("emotePickerOpen", {
        left: byKeys(() => move(-1)),
        right: byKeys(() => move(1)),
        up: byKeys(() =>
          setActiveIndex(nextVerticalIndex(sections(), activeIndex(), -1)),
        ),
        down: byKeys(() =>
          setActiveIndex(nextVerticalIndex(sections(), activeIndex(), 1)),
        ),
        tab: byKeys(() => cycleSection(1)),
        "shift-tab": byKeys(() => cycleSection(-1)),
        enter: () => selectActive(false),
      }),
      shortcuts.register(
        "emotePicker::insertKeepOpen",
        () => selectActive(true),
        "emotePickerOpen",
      ),
      shortcuts.register(
        "emotePicker::favorite",
        () => {
          const item = activeItem();
          if (item) toggleFavorite(item);
        },
        "emotePickerOpen",
      ),
    ];
    onCleanup(() => {
      for (const stop of stops) stop();
    });
  });

  const avatarOf = (id: string) => {
    if (id === "twitch") return selectedChannel()?.profileImageUrl;
    if (id.startsWith("channel-")) {
      return knownUser(id.slice("channel-".length))?.profileImageUrl;
    }
    return undefined;
  };
  const iconOf = (section: PickerSection) => (
    <SectionIcon
      sectionId={section.id}
      avatarUrl={avatarOf(section.id)}
      fallbackUrl={section.items[0]?.url}
    />
  );

  const jumpable = () =>
    viewSections().filter((s) => s.label && (s.items.length || s.empty));

  function toggleEmoji() {
    setSearch("");
    setEmojiView((on) => !on);
    queueMicrotask(scroll.toTop);
  }

  function openSection(id: string) {
    if (!search()) return scroll.jumpTo(id);
    setSearch("");
    queueMicrotask(() => scroll.jumpTo(id));
  }

  const activeSource = () => {
    const item = activeItem();
    return item ? sourceOf().get(item.value) : undefined;
  };

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
            ref={scroll.setRail}
            class="shrink-0 w-14 py-2 flex flex-col items-center gap-1.5 overflow-y-auto scrollbar-none border-r border-line"
          >
            <For each={jumpable()}>
              {(section) => (
                <RailButton
                  id={section.id}
                  label={section.label ?? ""}
                  active={!search() && scroll.current() === section.id}
                  onClick={() => openSection(section.id)}
                >
                  {iconOf(section)}
                </RailButton>
              )}
            </For>
          </nav>
        </Show>
        <div
          ref={scroll.setList}
          onScroll={scroll.track}
          class="relative overflow-y-auto flex-1 min-w-0 px-2 pb-1.5 flex flex-col scrollbar-gutter-stable"
        >
          <For each={sections()}>
            {(section) => (
              <Section
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
                  onToggleFavorite={toggleFavorite}
                  onHover={(idx) => {
                    setKeyboard(false);
                    setActiveIndex(idx);
                  }}
                  startIndex={section.startIndex}
                  activeIndex={activeIndex()}
                  keyboard={keyboard()}
                />
              </Section>
            )}
          </For>
        </div>
      </div>
      <Preview
        item={activeItem()}
        emptyHint={t("EMOTES_KEEP_OPEN_HINT")}
        detail={
          activeItem()?.disabled
            ? t("EMOTES_UNAVAILABLE_HINT")
            : sourceText(activeSource())
        }
        icon={activeSource() ? iconOf(activeSource()!.section) : undefined}
      />
    </ComposerPanel>
  );
}
