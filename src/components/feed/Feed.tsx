import {
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
} from "solid-js";
import type {
  FeedEvent as EventItem,
  FeedItem,
  FeedMessage as Message,
} from "../../lib/types/index.ts";
import { feeds, getItemId, isFeedItemVisible } from "../../lib/stores/feeds.ts";
import { favorites, thirdPartyEmoteMap } from "../../lib/stores/emotes.ts";
import {
  feedKeywords,
  feedShowDeletedContent,
  feedShowTimestamp,
} from "../../lib/stores/preferences.ts";
import * as shortcuts from "../../lib/services/shortcuts.ts";
import FeedMessage from "./FeedMessage.tsx";
import FeedEvent from "./FeedEvent.tsx";
import FeedDivider from "./FeedDivider.tsx";
import FeedDayDivider from "./FeedDayDivider.tsx";
import type { Density } from "../../lib/constants/density.ts";
import { layoutFeed } from "../../lib/utils/feedLayout.ts";
import type { UserRef } from "../../lib/types/index.ts";

export type FeedApi = {
  scrollToBottom: () => void;
  isPaused: () => boolean;
  getBounds: () => DOMRect | null;
  getElement: () => HTMLElement | null;
  moveSelection: (direction: 1 | -1) => void;
  clearSelection: () => void;
  getSelectedMessage: () => Message | null;
};

type Props = {
  broadcasterId: string;
  userLogin?: string;
  filter?: (item: FeedItem) => boolean;
  renderItem?: (item: FeedItem, index: () => number) => JSX.Element;
  density?: Density;
  showName?: boolean;
  showBadges?: boolean;
  showToolbar?: boolean;
  showDivider?: boolean;
  flush?: boolean;
  onContextMenu?: (x: number, y: number, msg: Message) => void;
  onReply?: (msg: Message) => void;
  onReact?: (msg: Message, value: string) => void;
  onCopypasta?: (msg: Message) => void;
  onJumpToMessage?: (messageId: string) => void;
  onShowUserCard?: (x: number, y: number, identity: Partial<UserRef>) => void;
  onUserContextMenu?: (
    x: number,
    y: number,
    identity: Partial<UserRef>,
  ) => void;
  onEventContextMenu?: (x: number, y: number, item: EventItem) => void;
  header?: JSX.Element;
  footer?: JSX.Element;
  class?: string;
  style?: JSX.CSSProperties;
  scrollClass?: string;
  onWheel?: (e: WheelEvent) => void;
  ref?: (api: FeedApi) => void;
};

export default function Feed(props: Props) {
  const [isPaused, setIsPaused] = createSignal(false);
  const [selectedId, setSelectedId] = createSignal<string | null>(null);

  let rootRef: HTMLDivElement | undefined;
  let scrollRef: HTMLDivElement | undefined;
  let bottomRef: HTMLDivElement | undefined;
  let isProgrammaticScroll = false;

  const items = createMemo<FeedItem[]>(() => {
    const all = feeds[props.broadcasterId]?.messages ?? [];
    return props.filter ? all.filter(props.filter) : all;
  });
  const badges = createMemo(() => feeds[props.broadcasterId]?.badges ?? {});
  const dividerAt = () =>
    props.showDivider === false
      ? null
      : (feeds[props.broadcasterId]?.dividerAtItemId ?? null);
  const reactions = createMemo(() => favorites().slice(0, 3));

  const dividerBeforeId = createMemo(() => {
    const at = dividerAt();
    if (at === null) return null;
    const all = items();
    const i = all.findIndex((item) => getItemId(item) === at);
    return i >= 0 && i + 1 < all.length ? getItemId(all[i + 1]) : null;
  });

  const layout = createMemo(() => {
    const visible = items().filter(isFeedItemVisible);
    const rows = layoutFeed(visible, props.density === "comfortable");
    const dayStarts = new Set<string>();
    const continued = new Set<string>();
    visible.forEach((item, i) => {
      const id = getItemId(item);
      if (rows[i].dayStart) dayStarts.add(id);
      if (rows[i].continued && id !== dividerBeforeId()) continued.add(id);
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
    items().filter((i): i is Message => i.kind === "message")
  );
  const selectedMessage = createMemo<Message | null>(() => {
    const id = selectedId();
    if (!id) return null;
    return messageList().find((m) => m.message_id === id) ?? null;
  });

  function moveSelection(direction: 1 | -1) {
    const list = messageList();
    if (list.length === 0) return;
    const id = selectedId();
    if (!id) {
      setSelectedId(list[direction === -1 ? list.length - 1 : 0].message_id);
      return;
    }
    const idx = list.findIndex((m) => m.message_id === id);
    if (idx < 0) {
      setSelectedId(list[direction === -1 ? list.length - 1 : 0].message_id);
      return;
    }
    const next = Math.min(Math.max(idx + direction, 0), list.length - 1);
    setSelectedId(list[next].message_id);
  }

  function clearSelection() {
    setSelectedId(null);
  }

  createEffect(() => {
    shortcuts.setContext("feedSelected", selectedId() !== null);
  });
  onCleanup(() => shortcuts.setContext("feedSelected", false));

  // Scroll active message into view + give it focus so the chat input loses it
  // (otherwise chat::send would still fire on Enter).
  createEffect(() => {
    const id = selectedId();
    if (!id) return;
    queueMicrotask(() => {
      const el = rootRef?.querySelector<HTMLElement>(
        `[data-feed-id="${CSS.escape(id)}"]`,
      );
      el?.scrollIntoView({ block: "nearest" });
      el?.focus({ preventScroll: true });
    });
  });

  function scrollInstant() {
    setIsPaused(false);
    isProgrammaticScroll = true;
    bottomRef?.scrollIntoView({ behavior: "instant" });
  }

  function onScroll(e: Event) {
    if (isProgrammaticScroll) {
      isProgrammaticScroll = false;
      return;
    }
    const el = e.currentTarget as HTMLDivElement;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setIsPaused(!atBottom);
  }

  createEffect(
    on(
      () => props.broadcasterId,
      () => {
        setIsPaused(false);
        setSelectedId(null);
        queueMicrotask(scrollInstant);
      },
    ),
  );

  createEffect(
    on(
      () => items().length,
      () => {
        if (!isPaused()) scrollInstant();
      },
    ),
  );

  onMount(() => {
    if (!scrollRef) return;
    const observer = new ResizeObserver(() => {
      if (!isPaused()) scrollInstant();
    });
    observer.observe(scrollRef);
    onCleanup(() => observer.disconnect());
  });

  onMount(() => {
    props.ref?.({
      scrollToBottom: scrollInstant,
      isPaused,
      getBounds: () => rootRef?.getBoundingClientRect() ?? null,
      getElement: () => rootRef ?? null,
      moveSelection,
      clearSelection,
      getSelectedMessage: () => selectedMessage(),
    });
  });

  const defaultRender = (item: FeedItem) => (
    <Show when={isFeedItemVisible(item)}>
      {item.kind === "event"
        ? (
          <FeedEvent
            item={item}
            density={props.density}
            showTimestamp={feedShowTimestamp()}
            flush={props.flush}
            onContextMenu={props.onEventContextMenu}
          />
        )
        : (
          <FeedMessage
            item={item}
            emotes={thirdPartyEmoteMap()}
            badges={badges()}
            userLogin={props.userLogin ?? ""}
            selected={selectedId() === item.message_id}
            keywords={feedKeywords()}
            density={props.density}
            continued={isContinued(getItemId(item))}
            showTimestamp={feedShowTimestamp()}
            showDeletedContent={feedShowDeletedContent()}
            showName={props.showName}
            showBadges={props.showBadges}
            showToolbar={props.showToolbar}
            flush={props.flush}
            reactions={reactions()}
            onContextMenu={props.onContextMenu}
            onReply={props.onReply}
            onReact={props.onReact}
            onCopypasta={props.onCopypasta}
            onUserContextMenu={props.onUserContextMenu}
            onJumpToMessage={props.onJumpToMessage}
            onShowUserCard={props.onShowUserCard}
          />
        )}
    </Show>
  );

  const render = (item: FeedItem, index: () => number) =>
    props.renderItem ? props.renderItem(item, index) : defaultRender(item);

  return (
    <div
      ref={rootRef}
      class={`flex-1 relative min-h-0 ${props.class ?? ""}`}
      style={props.style}
      onFocusOut={(e) => {
        const next = e.relatedTarget as Node | null;
        if (!next || !rootRef?.contains(next)) clearSelection();
      }}
    >
      {props.header}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        onWheel={props.onWheel}
        class={`h-full overflow-y-auto overflow-x-hidden flex flex-col scrollbar-gutter-stable ${
          props.scrollClass ?? ""
        }`}
      >
        <For each={items()}>
          {(item, index) => (
            <>
              <Show when={startsDay(getItemId(item))}>
                <FeedDayDivider ts={item.timestamp} />
              </Show>
              <Show when={hasDividerBefore(getItemId(item))}>
                <FeedDivider />
              </Show>
              <div
                data-feed-id={item.kind === "message"
                  ? item.message_id
                  : undefined}
                tabIndex={-1}
                class="outline-none"
              >
                {render(item, index)}
              </div>
            </>
          )}
        </For>
        <div ref={bottomRef} />
      </div>
      {props.footer}
    </div>
  );
}
