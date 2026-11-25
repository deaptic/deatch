import {
  batch,
  createEffect,
  createMemo,
  createSelector,
  createSignal,
  For,
  type JSX,
  on,
  onCleanup,
  onMount,
  Show,
  untrack,
} from "solid-js";
import type {
  FeedEntry,
  FeedEvent as Event,
  FeedMessage as Message,
} from "./types.ts";
import { channelEntries, feeds, isFeedEntryVisible } from "./store/index.ts";
import { getEntryId } from "./store/entryId.ts";
import { historyViews } from "./history/views.ts";
import * as history from "./history/history.ts";
import { addToast } from "../../kit/toasts.ts";
import { thirdPartyEmoteMap, usableFavorites } from "../emotes/index.ts";
import { knownUser } from "../users/index.ts";
import { cheermotes } from "../emotes/index.ts";
import { jumpTarget, setJumpTarget } from "../navigation/index.ts";
import { createFeedScroll } from "./createFeedScroll.ts";
import { createFeedWindow } from "./createFeedWindow.ts";
import {
  highlightWords,
  feedShowDeletedContent,
  feedShowTimestamp,
} from "../preferences/index.ts";
import * as shortcuts from "../../shared/keyboard/shortcuts.ts";
import FeedRow from "./FeedRow.tsx";
import Divider from "../../kit/Divider.tsx";
import { t } from "../../shared/i18n/index.ts";
import type { Density } from "../../shared/density.ts";
import { dayLabel, layoutFeed } from "./layout.ts";
import { type UserActions } from "../message/index.ts";
import { at } from "../../shared/at.ts";
import { groupsMessages } from "./grouping.ts";
import * as clock from "../../shared/clock.ts";
import { scrollBehavior } from "../../kit/scrollBehavior.ts";

const JUMP_ATTEMPTS = 30;

export type FeedApi = {
  scrollToBottom: () => void;
  isPaused: () => boolean;
  getBounds: () => DOMRect | null;
  getElement: () => HTMLElement | null;
  moveSelection: (direction: 1 | -1) => void;
  clearSelection: () => void;
  getSelectedMessage: () => Message | null;
  getSelectedBounds: () => DOMRect | null;
};

type Props = UserActions & {
  broadcasterId: string;
  entries?: FeedEntry[];
  userLogin?: string;
  filter?: (item: FeedEntry) => boolean;
  density?: Density;
  showName?: boolean;
  showBadges?: boolean;
  showToolbar?: boolean;
  highlightMentions?: boolean;
  showDivider?: boolean;
  flush?: boolean;
  onContextMenu?: (x: number, y: number, msg: Message) => void;
  onReply?: (msg: Message) => void;
  onReact?: (msg: Message, value: string) => void;
  onCopypasta?: (msg: Message) => void;
  onJumpToMessage?: (messageId: string) => void;
  onOpenChannel?: (broadcasterId: string) => void;
  onEventContextMenu?: (x: number, y: number, item: Event) => void;
  header?: JSX.Element;
  class?: string;
  style?: JSX.CSSProperties;
  scrollClass?: string;
  onWheel?: (e: WheelEvent) => void;
  ref?: (api: FeedApi) => void;
};

export default function Feed(props: Props) {
  const [selectedId, setSelectedId] = createSignal<string | null>(null);

  let rootRef: HTMLDivElement | undefined;
  let scrollRef: HTMLDivElement | undefined;
  let listRef: HTMLDivElement | undefined;
  const ownsHistory = () => props.entries === undefined;
  const showingLive = () =>
    !ownsHistory() || historyViews[props.broadcasterId]?.atLive !== false;
  const scroll = createFeedScroll(
    () => scrollRef,
    {
      idAt: (y) => win.idAt(y),
      topOf: (id) => win.topOf(id),
    },
    showingLive,
  );

  const entries = createMemo<FeedEntry[]>(() => {
    const all = props.entries ?? channelEntries(props.broadcasterId);
    return props.filter ? all.filter(props.filter) : all;
  });
  const ids = createMemo(() => entries().map(getEntryId));
  const win = createFeedWindow({
    ids,
    scroller: () => scrollRef,
    list: () => listRef,
    following: () => !scroll.isPaused(),
  });
  const shown = createMemo(() => {
    const { start, end } = win.range();
    return entries().slice(start, end);
  });

  function loadAtEdges(el: HTMLElement) {
    if (!ownsHistory()) return;
    const id = props.broadcasterId;
    if (el.scrollTop < el.clientHeight) void history.older(id);
    if (el.scrollHeight - el.clientHeight - el.scrollTop < el.clientHeight) {
      void history.newer(id);
    }
  }

  function toPresent() {
    const view = historyViews[props.broadcasterId];
    if (ownsHistory() && view && !view.atLive) {
      history.close(props.broadcasterId);
    }
    scroll.toBottom();
  }
  onCleanup(() => {
    if (ownsHistory()) history.close(props.broadcasterId);
  });

  let lookingUp: string | null = null;
  function lookUp(messageId: string) {
    if (lookingUp === messageId) return;
    lookingUp = messageId;
    void history.around(props.broadcasterId, messageId).then((outcome) => {
      lookingUp = null;
      if (outcome === "opened") return;
      if (jumpTarget()?.messageId !== messageId) return;
      setJumpTarget(null);
      toPresent();
      if (outcome === "missing") addToast(t("FEED_MESSAGE_GONE_TOAST"));
    });
  }

  function show(id: string) {
    if (win.isRendered(id)) return;
    batch(() => {
      scroll.read();
      win.reveal(id);
    });
  }
  const badges = createMemo(() => feeds[props.broadcasterId]?.badges ?? {});
  const dividerAt = () =>
    props.showDivider === false
      ? null
      : (feeds[props.broadcasterId]?.dividerAtEntryId ?? null);
  const reactions = createMemo(() =>
    usableFavorites(knownUser(props.broadcasterId) ?? null).slice(0, 3),
  );

  const dividerBeforeId = createMemo(() => {
    const dividerId = dividerAt();
    if (dividerId === null) return null;
    const all = entries();
    const i = all.findIndex((item) => getEntryId(item) === dividerId);
    const next = i >= 0 ? all[i + 1] : undefined;
    return next ? getEntryId(next) : null;
  });

  const layout = createMemo(() => {
    const visible = entries().filter(isFeedEntryVisible);
    const rows = layoutFeed(visible, groupsMessages(props.density));
    const dayStarts = new Set<string>();
    const continued = new Set<string>();
    visible.forEach((item, i) => {
      const id = getEntryId(item);
      const row = at(rows, i);
      if (row.dayStart) dayStarts.add(id);
      if (row.continued && id !== dividerBeforeId()) continued.add(id);
    });
    return { dayStarts, continued };
  });

  const hasDividerBefore = createSelector(dividerBeforeId);
  const startsDay = createSelector(
    () => layout().dayStarts,
    (id: string, ids) => ids.has(id),
  );
  const isContinued = createSelector(
    () => layout().continued,
    (id: string, ids) => ids.has(id),
  );

  const messageList = createMemo<Message[]>(() =>
    entries().filter((i): i is Message => i.kind === "message"),
  );
  const selectedMessage = createMemo<Message | null>(() => {
    const id = selectedId();
    if (!id) return null;
    return messageList().find((m) => m.message_id === id) ?? null;
  });

  function moveSelection(direction: 1 | -1) {
    const list = messageList();
    const idx = list.findIndex((m) => m.message_id === selectedId());
    const target =
      idx < 0
        ? list.at(direction === -1 ? -1 : 0)
        : list[Math.min(Math.max(idx + direction, 0), list.length - 1)];
    if (target) setSelectedId(target.message_id);
  }

  function clearSelection() {
    setSelectedId(null);
  }

  onMount(() => {
    const onFocusIn = (e: FocusEvent) => {
      if (!rootRef?.contains(e.target as Node)) clearSelection();
    };
    document.addEventListener("focusin", onFocusIn);
    onCleanup(() => document.removeEventListener("focusin", onFocusIn));
  });

  createEffect(() => {
    shortcuts.setContext("feedSelected", selectedId() !== null);
  });
  onCleanup(() => shortcuts.setContext("feedSelected", false));

  createEffect(() => {
    const id = selectedId();
    if (!id) return;
    queueMicrotask(() => {
      show(id);
      const el = rootRef?.querySelector<HTMLElement>(
        `[data-item-id="${CSS.escape(id)}"]`,
      );
      el?.scrollIntoView({ block: "nearest" });
      el?.focus({ preventScroll: true });
    });
  });

  let settled = false;
  onMount(() => requestAnimationFrame(() => (settled = true)));

  const itemEl = (id: string) =>
    rootRef?.querySelector<HTMLElement>(`[data-item-id="${CSS.escape(id)}"]`);

  let jumping: string | null = null;
  onCleanup(() => (jumping = null));

  function jumpWhenRendered(
    id: string,
    behavior: "smooth" | "instant",
    attempt: number,
  ) {
    if (jumping !== id) return;
    show(id);
    const el = itemEl(id);
    if (el) {
      jumping = null;
      scroll.jumpTo(id, el, behavior, () => setSelectedId(id));
    } else if (attempt < JUMP_ATTEMPTS) {
      requestAnimationFrame(() => jumpWhenRendered(id, behavior, attempt + 1));
    } else {
      jumping = null;
    }
  }

  createEffect(() => {
    const target = jumpTarget();
    if (!target || target.broadcasterId !== props.broadcasterId) return;
    untrack(scroll.read);
    const loaded = messageList().some((m) => m.message_id === target.messageId);
    if (!loaded) {
      if (ownsHistory() && feeds[props.broadcasterId]?.backfilled) {
        untrack(() => lookUp(target.messageId));
      }
      return;
    }
    jumping = target.messageId;
    setJumpTarget(null);
    const behavior = settled ? scrollBehavior() : "instant";
    untrack(() => jumpWhenRendered(target.messageId, behavior, 0));
  });

  createEffect(
    on(
      () => props.broadcasterId,
      () => {
        setSelectedId(null);
        queueMicrotask(scroll.toBottom);
      },
      { defer: true },
    ),
  );

  createEffect(
    on(
      () => scroll.isPaused(),
      (paused) => {
        const view = historyViews[props.broadcasterId];
        if (!paused && ownsHistory() && view?.atLive) {
          history.close(props.broadcasterId);
        }
      },
      { defer: true },
    ),
  );

  createEffect(on(() => entries().at(-1), scroll.keep));

  createEffect(
    on(entries, () =>
      queueMicrotask(() => {
        const el = scrollRef;
        if (ownsHistory() && el && el.scrollHeight <= el.clientHeight) {
          void history.older(props.broadcasterId);
        }
      }),
    ),
  );

  onMount(() => {
    if (listRef) onCleanup(scroll.watch(listRef));
    onCleanup(win.watch());
  });

  onMount(() => {
    props.ref?.({
      scrollToBottom: toPresent,
      isPaused: scroll.isPaused,
      getBounds: () => rootRef?.getBoundingClientRect() ?? null,
      getElement: () => rootRef ?? null,
      moveSelection,
      clearSelection,
      getSelectedMessage: () => selectedMessage(),
      getSelectedBounds: () => {
        const id = selectedId();
        return id ? (itemEl(id)?.getBoundingClientRect() ?? null) : null;
      },
    });
  });

  const row = (entry: FeedEntry) => (
    <FeedRow
      entry={entry}
      density={props.density ?? "compact"}
      continued={isContinued(getEntryId(entry))}
      selected={entry.kind === "message" && selectedId() === entry.message_id}
      flush={props.flush}
      showTimestamp={feedShowTimestamp()}
      emotes={thirdPartyEmoteMap()}
      cheermotes={cheermotes.forChannel(props.broadcasterId)}
      badges={badges()}
      userLogin={props.userLogin ?? ""}
      reactions={reactions()}
      keywords={highlightWords()}
      showDeletedContent={feedShowDeletedContent()}
      showName={props.showName}
      showBadges={props.showBadges}
      showToolbar={props.showToolbar}
      highlightMentions={props.highlightMentions}
      onContextMenu={props.onContextMenu}
      onReply={props.onReply}
      onReact={props.onReact}
      onCopypasta={props.onCopypasta}
      onJumpToMessage={props.onJumpToMessage}
      onOpenChannel={props.onOpenChannel}
      onShowUserCard={props.onShowUserCard}
      onUserContextMenu={props.onUserContextMenu}
      onEventContextMenu={props.onEventContextMenu}
    />
  );

  return (
    <div
      ref={rootRef}
      class={`flex-1 relative min-h-0 ${props.class ?? ""}`}
      style={props.style}
    >
      {props.header}
      <div
        ref={scrollRef}
        onScroll={(e) =>
          batch(() => {
            win.sync();
            scroll.onScroll(e);
            loadAtEdges(e.currentTarget);
          })
        }
        onWheel={props.onWheel}
        class={`h-full overflow-y-auto overflow-x-hidden flex flex-col scrollbar-gutter-stable ${
          props.scrollClass ?? ""
        }`}
      >
        <div ref={listRef} class="shrink-0 flex flex-col">
          <div
            class="h-(--space)"
            style={{ "--space": `${win.range().before}px` }}
          />
          <For each={shown()}>
            {(entry) => (
              <div
                class="flow-root"
                data-row-id={getEntryId(entry)}
                ref={win.measure}
              >
                <Show when={startsDay(getEntryId(entry))}>
                  <Divider
                    variant="tag"
                    label={dayLabel(entry.timestamp, clock.now())}
                  />
                </Show>
                <Show when={hasDividerBefore(getEntryId(entry))}>
                  <Divider
                    variant="accent"
                    label={t("FEED_NEW_MESSAGES_LABEL")}
                  />
                </Show>
                <Show when={isFeedEntryVisible(entry)}>{row(entry)}</Show>
              </div>
            )}
          </For>
          <div
            class="h-(--space)"
            style={{ "--space": `${win.range().after}px` }}
          />
        </div>
      </div>
    </div>
  );
}
