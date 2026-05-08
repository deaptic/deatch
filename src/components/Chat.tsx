import {
  createSignal,
  createEffect,
  createMemo,
  on,
  For,
  Show,
  onCleanup,
  onMount,
} from "solid-js";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { buildThirdPartyEmoteMap } from "../emotes";
import ChatMessage, { ChatMsg, BadgeMap, Fragment } from "./ChatMessage";
import ChatNotification, { ChatNotice } from "./ChatNotification";
import ChatInput from "./ChatInput";
import ChatSettings from "./ChatSettings";
import ChatMessageContextMenu from "./ChatMessageContextMenu";
import ChatTitleBar from "./ChatTitleBar";
import { getTimestamp } from "../utils";
import type {
  ModeratedChannel,
  RawChatMessage,
  RawNotification,
  RawShoutout,
  RawFollow,
  RawFragment,
  BadgeSet,
} from "../types";
import {
  contextMenu,
  replyTo,
  clearReply,
  closeContextMenu,
  modAction,
  registerInputFocus,
} from "../chat-state";
import BanTimeoutModal from "./BanTimeoutModal";
import {
  NOTIF_EVENTS,
  NOTICE_TO_NOTIF,
  BADGE_CATEGORIES,
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

type ChatItem = ChatMsg | ChatNotice;

const CHANNEL_POINT_TYPES = new Set([
  "channel_points_highlighted",
  "channel_points_sub_only",
  "power_ups_message_effect",
  "power_ups_gigantified_emote",
]);

function mapFragment(f: RawFragment): Fragment {
  switch (f.type) {
    case "emote":
      return { type: "emote", text: f.text, id: f.emote.id };
    case "mention":
      return { type: "mention", text: f.text, user_login: f.mention.user_login };
    case "cheermote":
      return { type: "cheermote", text: f.text };
    default:
      return { type: "text", text: f.text };
  }
}

function mapChatMessage(raw: RawChatMessage, timestamp: string): ChatMsg {
  return {
    kind: "message",
    message_id: raw.message_id,
    chatter_user_id: raw.chatter_user_id,
    chatter_login: raw.chatter_user_login,
    chatter_name: raw.chatter_user_name,
    color: raw.color,
    fragments: raw.message.fragments.map(mapFragment),
    badges: raw.badges,
    reply: raw.reply ?? undefined,
    timestamp,
    channel_points:
      !!raw.channel_points_custom_reward_id || CHANNEL_POINT_TYPES.has(raw.message_type),
    first_message: raw.message_type === "user_intro",
  };
}

type Props = {
  broadcasterName: string;
  broadcasterId: string;
  broadcasterLogin: string;
  userLogin: string;
  moderatedChannels: ModeratedChannel[];
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};


export default function Chat(props: Props) {
  const [messages, setMessages] = createSignal<ChatItem[]>([]);
  const [badges, setBadges] = createSignal<BadgeMap>({});

  const emoteMap = createMemo(buildThirdPartyEmoteMap);

  const _prefs = loadUserPreferences();
  function updatePrefs(update: (p: ReturnType<typeof loadUserPreferences>) => ReturnType<typeof loadUserPreferences>) {
    saveUserPreferences(update(loadUserPreferences()));
  }
  const [fontSize, setFontSize] = createSignal(_prefs.feed.fontSize);
  const [showTimestamp, setShowTimestamp] = createSignal(_prefs.feed.showTimestamp);
  const [autoShoutout, setAutoShoutout] = createSignal(
    localStorage.getItem("auto_shoutout") === "true",
  );
  const [mutedUsers, setMutedUsers] = createSignal<string[]>(_prefs.feed.users.muted);
  function persistMutedUsers(users: string[]) {
    updatePrefs((p) => ({ ...p, feed: { ...p.feed, users: { muted: users } } }));
    setMutedUsers(users);
  }
  const [notifPrefs, setNotifPrefs] = createSignal<Record<NotifKey, EventPref>>(_prefs.feed.events as Record<NotifKey, EventPref>);
  function setNotifPref(key: NotifKey, value: boolean) {
    setNotifPrefs((p) => {
      const next = { ...p, [key]: { show: value } };
      updatePrefs((p) => ({ ...p, feed: { ...p.feed, events: next } }));
      return next;
    });
  }
  const [useDisplayName, setUseDisplayName] = createSignal(_prefs.feed.users.showDisplayName);
  const [badgePrefs, setBadgePrefs] = createSignal<Record<BadgeCategoryKey, BadgePref>>(_prefs.feed.badges as Record<BadgeCategoryKey, BadgePref>);
  function setBadgePref(key: BadgeCategoryKey, value: boolean) {
    setBadgePrefs((p) => {
      const next = { ...p, [key]: { show: value } };
      updatePrefs((p) => ({ ...p, feed: { ...p.feed, badges: next } }));
      return next;
    });
  }
  function changeFontSize(delta: number) {
    setFontSize((s) => {
      const next = Math.min(24, Math.max(11, s + delta));
      updatePrefs((p) => ({ ...p, feed: { ...p.feed, fontSize: next } }));
      return next;
    });
  }
  const isMod = () =>
    props.broadcasterLogin === props.userLogin ||
    props.moderatedChannels.some(
      (c) => c.broadcaster_id === props.broadcasterId,
    );
  const [paused, setPaused] = createSignal(false);
  let bottomRef: HTMLDivElement | undefined;
  let scrollRef: HTMLDivElement | undefined;
  let isProgrammaticScroll = false;

  function scrollInstant() {
    isProgrammaticScroll = true;
    bottomRef?.scrollIntoView({ behavior: "instant" });
  }

  function scrollToBottom() {
    setMessages((prev) => prev.slice(-500));
    setPaused(false);
    scrollInstant();
  }

  function onScrollChat(e: Event) {
    if (isProgrammaticScroll) {
      isProgrammaticScroll = false;
      return;
    }
    const el = e.currentTarget as HTMLDivElement;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setPaused(!atBottom);
  }

  onMount(() => {
    const unlistens: (() => void)[] = [];
    onCleanup(() => unlistens.forEach((fn) => fn()));
    const append = (item: ChatItem) =>
      setMessages((prev) =>
        paused() ? [...prev, item] : [...prev.slice(-499), item],
      );
    listen<RawChatMessage>("chat-message", (e) => {
      if (
        mutedUsers().some(
          (u) => u.toLowerCase() === e.payload.chatter_user_login.toLowerCase(),
        )
      )
        return;
      append(mapChatMessage(e.payload, getTimestamp()));
    }).then((fn) => unlistens.push(fn));
    listen<RawNotification>("chat-notification", (e) => {
      const item: ChatNotice = {
        kind: "notice",
        notice_type: e.payload.notice_type,
        system_message: e.payload.system_message,
        chatter_user_id: e.payload.chatter_is_anonymous ? undefined : e.payload.chatter_user_id,
        chatter_name: e.payload.chatter_user_name ?? "anonymous",
        color: e.payload.color ?? "",
        timestamp: getTimestamp(),
      };
      if (e.payload.notice_type === "sub_gift") {
        setTimeout(() => append(item), 600);
      } else {
        append(item);
      }
      if (
        e.payload.notice_type === "raid" &&
        e.payload.chatter_user_id &&
        isMod() &&
        autoShoutout()
      ) {
        invoke("send_shoutout", {
          fromBroadcasterId: props.broadcasterId,
          toBroadcasterId: e.payload.chatter_user_id,
        });
      }
    }).then((fn) => unlistens.push(fn));
    listen<RawShoutout>("chat-shoutout-create", (e) => {
      append({
        kind: "notice",
        notice_type: "shoutout",
        system_message: `Shoutout to ${e.payload.to_broadcaster_user_name}!`,
        chatter_name: e.payload.moderator_user_name,
        color: "",
        timestamp: getTimestamp(),
      });
    }).then((fn) => unlistens.push(fn));
    listen<RawFollow>("channel-follow", (e) => {
      append({
        kind: "notice",
        notice_type: "follow",
        system_message: `${e.payload.user_name} followed!`,
        chatter_user_id: e.payload.user_id,
        chatter_name: e.payload.user_name,
        color: "",
        timestamp: getTimestamp(),
      });
    }).then((fn) => unlistens.push(fn));
    listen<string>("chat-error", (e) => {
      console.error("Chat error:", e.payload);
    }).then((fn) => unlistens.push(fn));
  });

  createEffect(() => {
    const id = props.broadcasterId;
    setMessages([]);
    setBadges({});
    closeContextMenu();
    clearReply();

    Promise.all([
      invoke<BadgeSet[]>("get_global_chat_badges").catch(() => []),
      invoke<BadgeSet[]>("get_channel_chat_badges", { broadcasterId: id }).catch(() => []),
    ]).then(([global, channel]) => {
      const map: BadgeMap = {};
      for (const set of global)
        for (const v of set.versions) map[`${set.set_id}/${v.id}`] = v.image_url_1x;
      for (const set of channel)
        for (const v of set.versions) map[`${set.set_id}/${v.id}`] = v.image_url_1x;
      setBadges(map);
    });

  });

  createEffect(on(messages, () => {
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
        sidebarCollapsed={props.sidebarCollapsed}
        onToggleSidebar={props.onToggleSidebar}
        actions={
          <>
            <Show when={isMod()}>
              <button class="w-6 h-6 flex items-center justify-center rounded hover:bg-[#2d2d35] transition-colors cursor-pointer">
                <SwordIcon class="w-3.5 h-3.5 fill-[#00c8af]" />
              </button>
            </Show>
            <ChatSettings
              isMod={isMod()}
              fontSize={fontSize}
              onFontSizeChange={changeFontSize}
              showTimestamp={showTimestamp}
              onShowTimestampChange={(v) => {
                updatePrefs((p) => ({ ...p, feed: { ...p.feed, showTimestamp: v } }));
                setShowTimestamp(v);
              }}
              mutedUsers={mutedUsers}
              onMutedUsersChange={persistMutedUsers}
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
                setMessages((prev) =>
                  paused() ? [...prev, item] : [...prev.slice(-499), item],
                );
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
                setAutoShoutout(false);
                setMutedUsers(DEFAULT_PREFERENCES.feed.users.muted);
                setUseDisplayName(DEFAULT_PREFERENCES.feed.users.showDisplayName);
                setNotifPrefs(DEFAULT_PREFERENCES.feed.events as Record<NotifKey, EventPref>);
                setBadgePrefs(DEFAULT_PREFERENCES.feed.badges as Record<BadgeCategoryKey, BadgePref>);
              }}
            />
          </>
        }
      />

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
          class="h-full overflow-y-auto px-2 flex flex-col"
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
      <Show when={modAction()}>
        <BanTimeoutModal broadcasterId={props.broadcasterId} />
      </Show>
    </div>
  );
}
