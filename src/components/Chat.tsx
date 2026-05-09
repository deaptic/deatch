import {
  createEffect,
  createMemo,
  on,
  For,
  Show,
  onCleanup,
  onMount,
  createSignal,
} from "solid-js";
import { buildThirdPartyEmoteMap } from "../emotes";
import ChatMessage from "./ChatMessage";
import ChatNotification from "./ChatNotification";
import ChatInput from "./ChatInput";
import ChatSettings from "./ChatSettings";
import ChatMessageContextMenu from "./ChatMessageContextMenu";
import ChatNotificationContextMenu from "./ChatNotificationContextMenu";
import ChatTitleBar from "./ChatTitleBar";
import { getTimestamp } from "../utils";
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
  mutedUsers,
  setMutedUsers,
  type ChatItem,
} from "../chat-feed";
import BanTimeoutModal from "./BanTimeoutModal";
import {
  NOTIF_EVENTS,
  NOTICE_TO_NOTIF,
  type NotifKey,
  type BadgeCategoryKey,
} from "../constants";
import {
  loadUserPreferences,
  saveUserPreferences,
  DEFAULT_PREFERENCES,
  type EventPref,
  type BadgePref,
} from "../preferences";
import SwordIcon from "../icons/SwordIcon";
import { fontSize, changeFontSize, setFontSize, useDisplayName, setUseDisplayName } from "../feed-prefs";

type Props = {
  broadcasterName: string;
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

  const _prefs = loadUserPreferences();
  function updatePrefs(update: (p: ReturnType<typeof loadUserPreferences>) => ReturnType<typeof loadUserPreferences>) {
    saveUserPreferences(update(loadUserPreferences()));
  }
  const [showTimestamp, setShowTimestamp] = createSignal(_prefs.feed.showTimestamp);
  const [notifPrefs, setNotifPrefs] = createSignal<Record<NotifKey, EventPref>>(_prefs.feed.events as Record<NotifKey, EventPref>);
  function setNotifPref(key: NotifKey, value: boolean) {
    setNotifPrefs((p) => {
      const next = { ...p, [key]: { show: value } };
      updatePrefs((p) => ({ ...p, feed: { ...p.feed, events: next } }));
      return next;
    });
  }
  const [badgePrefs, setBadgePrefs] = createSignal<Record<BadgeCategoryKey, BadgePref>>(_prefs.feed.badges as Record<BadgeCategoryKey, BadgePref>);
  function setBadgePref(key: BadgeCategoryKey, value: boolean) {
    setBadgePrefs((p) => {
      const next = { ...p, [key]: { show: value } };
      updatePrefs((p) => ({ ...p, feed: { ...p.feed, badges: next } }));
      return next;
    });
  }
  const isMod = () =>
    props.broadcasterLogin === props.userLogin ||
    props.moderatedChannels.some(
      (c) => c.broadcaster_id === props.broadcasterId,
    );
  let bottomRef: HTMLDivElement | undefined;
  let scrollRef: HTMLDivElement | undefined;
  let panelMount: HTMLDivElement | undefined;
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

  return (
    <div class="flex flex-col h-full bg-[#0e0e10]">
      <ChatTitleBar
        broadcasterName={props.broadcasterName}
        actions={
          <>
            <Show when={isMod()}>
              <button class="w-6 h-6 flex items-center justify-center rounded hover:bg-[#2d2d35] transition-colors cursor-pointer">
                <SwordIcon class="w-3.5 h-3.5 fill-[#00c8af]" />
              </button>
            </Show>
            <ChatSettings
              isMod={isMod()}
              panelMount={() => panelMount}
              fontSize={fontSize}
              onFontSizeChange={changeFontSize}
              showTimestamp={showTimestamp}
              onShowTimestampChange={(v) => {
                updatePrefs((p) => ({ ...p, feed: { ...p.feed, showTimestamp: v } }));
                setShowTimestamp(v);
              }}
              mutedUsers={mutedUsers}
              onMutedUsersChange={setMutedUsers}
              notifPrefs={notifPrefs}
              onNotifPrefChange={setNotifPref}
              badgePrefs={badgePrefs}
              onBadgePrefChange={setBadgePref}
              onTestChatEvent={(key) => {
                const event = NOTIF_EVENTS.find((e) => e.key === key);
                if (!event || !("testMessage" in event)) return;
                const timestamp = getTimestamp();
                const item: ChatItem =
                  key === "message"
                    ? {
                        kind: "message",
                        message_id: `test-${Date.now()}`,
                        chatter_user_id: "test",
                        chatter_login: "testuser",
                        chatter_name: "TestUser",
                        color: "#9146ff",
                        fragments: [{ type: "text", text: event.testMessage }],
                        badges: [],
                        timestamp,
                      }
                    : {
                        kind: "notice",
                        notice_type: event.types[0] ?? event.key,
                        system_message: event.testMessage,
                        chatter_name: "TestUser",
                        color: "#9146ff",
                        timestamp,
                      };
                appendItem(props.broadcasterId, item);
              }}
              useDisplayName={useDisplayName}
              onUseDisplayNameChange={(v) => {
                updatePrefs((p) => ({ ...p, feed: { ...p.feed, users: { ...p.feed.users, showDisplayName: v } } }));
                setUseDisplayName(v);
              }}
              onResetDefaults={() => {
                saveUserPreferences(DEFAULT_PREFERENCES);
                localStorage.removeItem("auto_shoutout");
                setFontSize(DEFAULT_PREFERENCES.feed.fontSize);
                setShowTimestamp(DEFAULT_PREFERENCES.feed.showTimestamp);
                setMutedUsers(DEFAULT_PREFERENCES.feed.users.muted);
                setUseDisplayName(DEFAULT_PREFERENCES.feed.users.showDisplayName);
                setNotifPrefs(DEFAULT_PREFERENCES.feed.events as Record<NotifKey, EventPref>);
                setBadgePrefs(DEFAULT_PREFERENCES.feed.badges as Record<BadgeCategoryKey, BadgePref>);
              }}
            />
          </>
        }
      />

      <div class="flex-1 relative min-h-0" ref={(el) => panelMount = el}>
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
            {(item) =>
              item.kind === "notice" ? (
                <Show when={(() => { const k = NOTICE_TO_NOTIF[item.notice_type]; return !k || notifPrefs()[k]?.show !== false; })()}>
                  <ChatNotification item={item} showTimestamp={showTimestamp()} />
                </Show>
              ) : (
                <Show when={notifPrefs().message?.show !== false}>
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
              )
            }
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
