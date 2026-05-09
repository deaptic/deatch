import {
  createEffect,
  createMemo,
  on,
  For,
  Show,
  onCleanup,
  onMount,
} from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { buildThirdPartyEmoteMap, favorites } from "../../emotes";
import FeedMessage from "./FeedMessage";
import FeedEvent from "./FeedEvent";
import FeedDivider from "./FeedDivider";
import FeedInput from "./FeedInput";
import MessageContextMenu from "../context-menus/MessageContextMenu";
import EventContextMenu from "../context-menus/EventContextMenu";
import BanTimeoutModal from "./BanTimeoutModal";
import { moderatedChannels } from "../../user-state";
import type { FeedMessage as Message, FeedItem } from "./types";
import {
  contextMenu,
  closeContextMenu,
  openContextMenu,
  eventContextMenu,
  closeEventContextMenu,
  openEventContextMenu,
  replyTo,
  clearReply,
  startReply,
  modAction,
  openModAction,
  closeModAction,
  registerInputFocus,
} from "../../chat-state";
import {
  feeds,
  setPaused as setFeedPaused,
  trimToLatest,
  markSeen,
  clearDivider,
  getItemId,
} from "../../chat-feed";
import { NOTICE_TO_EVENT } from "../../constants";
import {
  feedFontSize,
  feedUserShowDisplayName,
  feedShowTimestamp,
  feedBadges,
  feedEvents,
  feedUserMuted,
  advancedDeveloperMode,
} from "../../preferences";
import CaretDownIcon from "../../icons/CaretDownIcon";

type Props = {
  broadcasterId: string;
  broadcasterLogin: string;
  userLogin: string;
};

export default function Feed(props: Props) {
  const items = createMemo<FeedItem[]>(() => feeds[props.broadcasterId]?.messages ?? []);
  const badges = createMemo(() => feeds[props.broadcasterId]?.badges ?? {});
  const paused = createMemo(() => feeds[props.broadcasterId]?.paused ?? false);
  const dividerAt = () => feeds[props.broadcasterId]?.dividerAtItemId ?? null;

  const emoteMap = createMemo(buildThirdPartyEmoteMap);
  const reactions = () => favorites().slice(0, 3);

  const isMod = () =>
    props.broadcasterLogin === props.userLogin ||
    moderatedChannels().some((c) => c.broadcaster_id === props.broadcasterId);

  let bottomRef: HTMLDivElement | undefined;
  let scrollRef: HTMLDivElement | undefined;
  let isProgrammaticScroll = false;

  function scrollInstant() {
    isProgrammaticScroll = true;
    bottomRef?.scrollIntoView({ behavior: "instant" });
  }

  function scrollToBottom() {
    trimToLatest(props.broadcasterId);
    scrollInstant();
  }

  function onScroll(e: Event) {
    if (isProgrammaticScroll) {
      isProgrammaticScroll = false;
      return;
    }
    const el = e.currentTarget as HTMLDivElement;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setFeedPaused(props.broadcasterId, !atBottom);
    if (atBottom) markSeen(props.broadcasterId);
  }

  createEffect(on(() => props.broadcasterId, () => {
    queueMicrotask(() => { if (!paused()) scrollInstant(); });
  }));

  createEffect(on(() => items().length, () => {
    if (!paused()) scrollInstant();
  }));

  createEffect(() => {
    feedFontSize();
    requestAnimationFrame(() => { if (!paused()) scrollInstant(); });
  });

  onMount(() => {
    if (!scrollRef) return;
    const observer = new ResizeObserver(() => {
      if (!paused()) scrollInstant();
    });
    observer.observe(scrollRef);
    onCleanup(() => observer.disconnect());
  });

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      clearDivider(props.broadcasterId);
    };
    window.addEventListener("keydown", onKey);
    onCleanup(() => window.removeEventListener("keydown", onKey));
  });

  function isVisible(item: FeedItem): boolean {
    if (item.kind === "event") {
      const k = NOTICE_TO_EVENT[item.notice_type];
      return !k || feedEvents()[k]?.show !== false;
    }
    return (
      feedEvents().message?.show !== false &&
      !feedUserMuted().includes(item.chatter_user_id)
    );
  }

  function react(msg: Message, value: string) {
    invoke("send_chat_message", {
      broadcasterId: props.broadcasterId,
      message: value,
      replyParentMessageId: msg.message_id,
    });
  }

  return (
    <div class="flex flex-col h-full bg-[#0e0e10]">
      <div class="flex-1 relative min-h-0">
        <Show when={paused()}>
          <button
            onClick={scrollToBottom}
            class="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-[#9146ff] hover:bg-[#7c3aed] text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg transition-colors cursor-pointer"
          >
            <CaretDownIcon class="w-3 h-3" />
            Latest messages
          </button>
        </Show>
        <div
          ref={scrollRef}
          onScroll={onScroll}
          class="h-full overflow-y-auto pl-2 pr-3 flex flex-col [scrollbar-gutter:stable]"
          style={{ "font-size": `${feedFontSize()}px` }}
        >
          <For each={items()}>
            {(item, index) => (
              <>
                <Show
                  when={
                    index() > 0 &&
                    dividerAt() &&
                    getItemId(items()[index() - 1]) === dividerAt()
                  }
                >
                  <FeedDivider />
                </Show>
                <Show when={isVisible(item)}>
                  {item.kind === "event" ? (
                    <FeedEvent
                      item={item}
                      showTimestamp={feedShowTimestamp()}
                      onContextMenu={openEventContextMenu}
                    />
                  ) : (
                    <FeedMessage
                      item={item}
                      emotes={emoteMap()}
                      badges={badges()}
                      badgePrefs={feedBadges()}
                      userLogin={props.userLogin}
                      useDisplayName={feedUserShowDisplayName()}
                      showTimestamp={feedShowTimestamp()}
                      reactions={reactions()}
                      onContextMenu={openContextMenu}
                      onReply={startReply}
                      onReact={react}
                    />
                  )}
                </Show>
              </>
            )}
          </For>
          <div ref={bottomRef} />
        </div>
      </div>

      <FeedInput
        broadcasterId={props.broadcasterId}
        replyTo={replyTo}
        onClearReply={clearReply}
        expose={(api) => registerInputFocus(api.focus)}
      />

      <Show when={contextMenu()}>
        {(cm) => (
          <MessageContextMenu
            x={cm().x}
            y={cm().y}
            msg={cm().msg}
            isMod={isMod()}
            broadcasterId={props.broadcasterId}
            developerMode={advancedDeveloperMode()}
            onClose={closeContextMenu}
            onReply={startReply}
            onModAction={openModAction}
          />
        )}
      </Show>
      <Show when={eventContextMenu()}>
        {(cm) => (
          <EventContextMenu
            x={cm().x}
            y={cm().y}
            item={cm().item}
            developerMode={advancedDeveloperMode()}
            onClose={closeEventContextMenu}
          />
        )}
      </Show>
      <Show when={modAction()}>
        {(ma) => (
          <BanTimeoutModal
            action={ma().action}
            msg={ma().msg}
            broadcasterId={props.broadcasterId}
            onClose={closeModAction}
          />
        )}
      </Show>
    </div>
  );
}
