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
  FeedEntry,
  FeedEvent as Event,
  FeedMessage as Message,
} from "../../lib/types/index.ts";
import {
  feeds,
  getEntryId,
  isFeedEntryVisible,
} from "../../lib/stores/feeds.ts";
import {
  thirdPartyEmoteMap,
  usableFavorites,
} from "../../lib/stores/emotes.ts";
import { knownUser } from "../../lib/stores/users.ts";
import { cheermotesFor } from "../../lib/stores/cheermotes.ts";
import { jumpTarget, setJumpTarget } from "../../lib/stores/view.ts";
import { createFeedScroll } from "../../lib/primitives/createFeedScroll.ts";
import {
  feedKeywords,
  feedShowDeletedContent,
  feedShowTimestamp,
} from "../../lib/stores/preferences.ts";
import * as shortcuts from "../../lib/services/shortcuts.ts";
import FeedRow from "./FeedRow.tsx";
import Divider from "../ui/Divider.tsx";
import { t } from "../../lib/i18n/index.ts";
import type { Density } from "../../lib/constants/density.ts";
import { dayLabel, layoutFeed } from "../../lib/utils/feedLayout.ts";
import type { UserActions } from "../ui/userLink.ts";

export type FeedApi = {
  scrollToBottom: () => void;
  isPaused: () => boolean;
  getBounds: () => DOMRect | null;
  getElement: () => HTMLElement | null;
  moveSelection: (direction: 1 | -1) => void;
  clearSelection: () => void;
  getSelectedMessage: () => Message | null;
};

type Props = UserActions & {
  broadcasterId: string;
  /** Rendered instead of the channel's feed; badges still come from it. */
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
  onOpenChannel?: (channelId: string) => void;
  onEventContextMenu?: (x: number, y: number, item: Event) => void;
  header?: JSX.Element;
  footer?: JSX.Element;
  class?: string;
  style?: JSX.CSSProperties;
  scrollClass?: string;
  onWheel?: (e: WheelEvent) => void;
  ref?: (api: FeedApi) => void;
};

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

export default function Feed(props: Props) {
  const [selectedId, setSelectedId] = createSignal<string | null>(null);

  let rootRef: HTMLDivElement | undefined;
  let scrollRef: HTMLDivElement | undefined;
  const scroll = createFeedScroll(() => scrollRef);

  const entries = createMemo<FeedEntry[]>(() => {
    const all = props.entries ?? feeds[props.broadcasterId]?.messages ?? [];
    return props.filter ? all.filter(props.filter) : all;
  });
  const badges = createMemo(() => feeds[props.broadcasterId]?.badges ?? {});
  const dividerAt = () =>
    props.showDivider === false
      ? null
      : (feeds[props.broadcasterId]?.dividerAtEntryId ?? null);
  const reactions = createMemo(() =>
    usableFavorites(knownUser(props.broadcasterId) ?? null).slice(0, 3)
  );

  const dividerBeforeId = createMemo(() => {
    const at = dividerAt();
    if (at === null) return null;
    const all = entries();
    const i = all.findIndex((item) => getEntryId(item) === at);
    return i >= 0 && i + 1 < all.length ? getEntryId(all[i + 1]) : null;
  });

  const layout = createMemo(() => {
    const visible = entries().filter(isFeedEntryVisible);
    const rows = layoutFeed(visible, props.density === "comfortable");
    const dayStarts = new Set<string>();
    const continued = new Set<string>();
    visible.forEach((item, i) => {
      const id = getEntryId(item);
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
    entries().filter((i): i is Message => i.kind === "message")
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
        `[data-item-id="${CSS.escape(id)}"]`,
      );
      el?.scrollIntoView({ block: "nearest" });
      el?.focus({ preventScroll: true });
    });
  });

  // A jump glides when the feed was already on screen; a feed that mounted
  // for the jump has nowhere to glide from.
  let settled = false;
  onMount(() => requestAnimationFrame(() => (settled = true)));

  createEffect(() => {
    const target = jumpTarget();
    if (!target || target.channelId !== props.broadcasterId) return;
    if (!messageList().some((m) => m.message_id === target.messageId)) return;
    setJumpTarget(null);
    const behavior = settled && !reducedMotion.matches ? "smooth" : "instant";
    queueMicrotask(() => {
      const el = rootRef?.querySelector<HTMLElement>(
        `[data-item-id="${CSS.escape(target.messageId)}"]`,
      );
      if (el) {
        scroll.jumpTo(el, behavior, () => setSelectedId(target.messageId));
      }
    });
  });

  createEffect(
    on(
      () => props.broadcasterId,
      () => {
        setSelectedId(null);
        queueMicrotask(scroll.toBottom);
      },
    ),
  );

  // The last entry, not the count: at the cap every append evicts one, so
  // the length never changes.
  createEffect(on(() => entries().at(-1), scroll.follow));

  onMount(() => {
    if (!scrollRef) return;
    const observer = new ResizeObserver(scroll.follow);
    observer.observe(scrollRef);
    onCleanup(() => observer.disconnect());
  });

  onMount(() => {
    props.ref?.({
      scrollToBottom: scroll.toBottom,
      isPaused: scroll.isPaused,
      getBounds: () => rootRef?.getBoundingClientRect() ?? null,
      getElement: () => rootRef ?? null,
      moveSelection,
      clearSelection,
      getSelectedMessage: () => selectedMessage(),
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
      cheermotes={cheermotesFor(props.broadcasterId)}
      badges={badges()}
      userLogin={props.userLogin ?? ""}
      reactions={reactions()}
      keywords={feedKeywords()}
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
      onFocusOut={(e) => {
        const next = e.relatedTarget as Node | null;
        if (!next || !rootRef?.contains(next)) clearSelection();
      }}
    >
      {props.header}
      <div
        ref={scrollRef}
        onScroll={scroll.onScroll}
        onWheel={props.onWheel}
        class={`h-full overflow-y-auto overflow-x-hidden flex flex-col scrollbar-gutter-stable ${
          props.scrollClass ?? ""
        }`}
      >
        <For each={entries()}>
          {(entry) => (
            <>
              <Show when={startsDay(getEntryId(entry))}>
                <Divider
                  variant="pill"
                  label={dayLabel(entry.timestamp, Date.now())}
                />
              </Show>
              <Show when={hasDividerBefore(getEntryId(entry))}>
                <Divider variant="accent" label={t("FEED_NEW_MESSAGES")} />
              </Show>
              <Show when={isFeedEntryVisible(entry)}>{row(entry)}</Show>
            </>
          )}
        </For>
      </div>
      {props.footer}
    </div>
  );
}
