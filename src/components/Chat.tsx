import {
  createEffect,
  createMemo,
  on,
  For,
  Show,
  onCleanup,
  onMount,
} from "solid-js";
import { buildThirdPartyEmoteMap } from "../emotes";
import ChatMessage from "./ChatMessage";
import ChatNotification from "./ChatNotification";
import ChatInput from "./ChatInput";
import ChatMessageContextMenu from "./ChatMessageContextMenu";
import ChatNotificationContextMenu from "./ChatNotificationContextMenu";
import type { ModeratedChannel } from "../types";
import {
  contextMenu,
  notifContextMenu,
  replyTo,
  clearReply,
  modAction,
  registerInputFocus,
} from "../chat-state";
import {
  feeds,
  appendItem,
  setPaused as setFeedPaused,
  trimToLatest,
  markSeen,
  clearDivider,
  getItemId,
  type ChatItem,
} from "../chat-feed";
import BanTimeoutModal from "./BanTimeoutModal";
import { NOTICE_TO_NOTIF } from "../constants";
import { fontSize, useDisplayName, showTimestamp, badgePrefs, notifPrefs, mutedUsers } from "../feed-prefs";

type Props = {
  broadcasterId: string;
  broadcasterLogin: string;
  userLogin: string;
  moderatedChannels: ModeratedChannel[];
};


export default function Chat(props: Props) {
  const messages = createMemo<ChatItem[]>(() => feeds[props.broadcasterId]?.messages ?? []);
  const badges = createMemo(() => feeds[props.broadcasterId]?.badges ?? {});
  const paused = createMemo(() => feeds[props.broadcasterId]?.paused ?? false);

  const emoteMap = createMemo(buildThirdPartyEmoteMap);

  const isMod = () =>
    props.broadcasterLogin === props.userLogin ||
    props.moderatedChannels.some(
      (c) => c.broadcaster_id === props.broadcasterId,
    );
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

  function onScrollChat(e: Event) {
    if (isProgrammaticScroll) {
      isProgrammaticScroll = false;
      return;
    }
    const el = e.currentTarget as HTMLDivElement;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setFeedPaused(props.broadcasterId, !atBottom);
    if (atBottom) markSeen(props.broadcasterId);
  }

  // On channel switch, pin to bottom if the feed is not paused.
  createEffect(on(() => props.broadcasterId, () => {
    queueMicrotask(() => { if (!paused()) scrollInstant(); });
  }));

  createEffect(on(() => messages().length, () => {
    if (!paused()) scrollInstant();
  }));

  createEffect(() => {
    fontSize();
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
      if (e.key !== "Escape") return;
      if (e.defaultPrevented) return;
      clearDivider(props.broadcasterId);
    };
    window.addEventListener("keydown", onKey);
    onCleanup(() => window.removeEventListener("keydown", onKey));
  });

  return (
    <div class="flex flex-col h-full bg-[#0e0e10]">
      <div class="flex-1 relative min-h-0">
        <Show when={paused()}>
          <button
            onClick={scrollToBottom}
            class="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-[#9146ff] hover:bg-[#7c3aed] text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              class="w-3 h-3"
            >
              <path d="M8 12L2 6h12z" />
            </svg>
            Latest messages
          </button>
        </Show>
        <div
          ref={scrollRef}
          onScroll={onScrollChat}
          class="h-full overflow-y-auto pl-2 pr-3 flex flex-col [scrollbar-gutter:stable]"
          style={{ "font-size": `${fontSize()}px` }}
        >
          <For each={messages()}>
            {(item, index) => (
              <>
                <Show
                  when={
                    index() > 0 &&
                    feeds[props.broadcasterId]?.dividerAtItemId &&
                    getItemId(messages()[index() - 1]) === feeds[props.broadcasterId]?.dividerAtItemId
                  }
                >
                  <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 leading-[1.6] px-2 py-1 -mx-2 border-l-4 border-transparent select-none pointer-events-none">
                    <div class="h-[1em] flex items-center"><div class="w-full border-t border-red-500/60" /></div>
                    <span class="text-[0.65em] font-bold text-red-500 uppercase tracking-wider leading-none">
                      New
                    </span>
                    <div class="h-[1em] flex items-center"><div class="w-full border-t border-red-500/60" /></div>
                  </div>
                </Show>
                {item.kind === "notice" ? (
                  <Show when={(() => { const k = NOTICE_TO_NOTIF[item.notice_type]; return !k || notifPrefs()[k]?.show !== false; })()}>
                    <ChatNotification item={item} showTimestamp={showTimestamp()} />
                  </Show>
                ) : (
                  <Show
                    when={
                      notifPrefs().message?.show !== false &&
                      !mutedUsers().includes(item.chatter_login.toLowerCase())
                    }
                  >
                    <ChatMessage
                      item={item}
                      emotes={emoteMap()}
                      badges={badges()}
                      badgePrefs={badgePrefs()}
                      userLogin={props.userLogin}
                      broadcasterId={props.broadcasterId}
                      useDisplayName={useDisplayName()}
                      showTimestamp={showTimestamp()}
                    />
                  </Show>
                )}
              </>
            )}
          </For>
          <div ref={bottomRef} />
        </div>
      </div>

      <ChatInput
        broadcasterId={props.broadcasterId}
        replyTo={replyTo}
        onClearReply={clearReply}
        expose={(api) => registerInputFocus(api.focus)}
      />

      <Show when={contextMenu()}>
        <ChatMessageContextMenu
          isMod={isMod()}
          broadcasterId={props.broadcasterId}
        />
      </Show>
      <Show when={notifContextMenu()}>
        <ChatNotificationContextMenu />
      </Show>
      <Show when={modAction()}>
        <BanTimeoutModal broadcasterId={props.broadcasterId} />
      </Show>
    </div>
  );
}
