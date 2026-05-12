import {
  createEffect,
  createMemo,
  createSignal,
  on,
  For,
  Show,
  onCleanup,
  onMount,
} from "solid-js";
import { sendChatMessage } from "../../commands/chat";
import { buildThirdPartyEmoteMap, favorites } from "../../state/emotes";
import FeedMessage from "./FeedMessage";
import FeedEvent from "./FeedEvent";
import FeedDivider from "./FeedDivider";
import FeedInput from "./FeedInput";
import MessageContextMenu from "../context-menus/MessageContextMenu";
import UserContextMenu, { type UserContextTarget } from "../context-menus/UserContextMenu";
import UserCard from "../user-card/UserCard";
import { getUsers } from "../../commands/users";
import EventContextMenu from "../context-menus/EventContextMenu";
import BanTimeoutModal from "./BanTimeoutModal";
import InputPopover from "../../ui/InputPopover";
import { moderatedChannels } from "../../state/users";
import type { FeedMessage as Message, FeedEvent as EventItem, FeedItem } from "./types";
import {
  feeds,
  setPaused as setFeedPaused,
  trimToLatest,
  markSeen,
  clearDivider,
  getItemId,
} from "./feeds";
import { NOTICE_TO_EVENT } from "../../constants";
import {
  feedFontSize,
  setFeedFontSize,
  feedUserShowDisplayName,
  feedUserOverrideNameColor,
  feedShowTimestamp,
  feedShowDeletedContent,
  feedKeywords,
  feedBadges,
  feedEvents,
  feedUserMuted,
  feedUserNickname,
  setUserNickname,
  removeUserNickname,
  advancedDeveloperMode,
} from "../../state/preferences";
import CaretDownIcon from "../../icons/CaretDownIcon";

type Props = {
  broadcasterId: string;
  broadcasterLogin: string;
  userLogin: string;
  onJumpToMessage: (channelId: string, messageId: string) => void;
};

export default function Feed(props: Props) {
  const [contextMenu, setContextMenu] = createSignal<{ x: number; y: number; msg: Message } | null>(null);
  const [userContextMenu, setUserContextMenu] = createSignal<{ x: number; y: number } & UserContextTarget | null>(null);
  const [eventContextMenu, setEventContextMenu] = createSignal<{ x: number; y: number; item: EventItem } | null>(null);
  const [replyTo, setReplyTo] = createSignal<{ messageId: string; name: string; text: string } | null>(null);
  const [modAction, setModAction] = createSignal<{ action: "timeout" | "ban"; userId: string; userName: string } | null>(null);
  const [userCard, setUserCard] = createSignal<{ x: number; y: number; chatterId: string } | null>(null);
  const [nicknamePop, setNicknamePop] = createSignal<{ x: number; y: number; login: string } | null>(null);
  const [nicknameInput, setNicknameInput] = createSignal("");

  let inputApi: { focus: () => void; insert: (text: string) => void } | undefined;
  let rootRef: HTMLDivElement | undefined;

  const openContextMenu = (x: number, y: number, msg: Message) => setContextMenu({ x, y, msg });
  const closeContextMenu = () => setContextMenu(null);
  async function openUserCard(x: number, y: number, identity: { userId?: string; login?: string }) {
    let id = identity.userId;
    if (!id && identity.login) {
      try {
        const users = await getUsers({ logins: [identity.login] });
        id = users[0]?.id;
      } catch {
        return;
      }
    }
    if (id) setUserCard({ x, y, chatterId: id });
  }
  const openEventContextMenu = (x: number, y: number, item: EventItem) => setEventContextMenu({ x, y, item });
  const closeEventContextMenu = () => setEventContextMenu(null);
  const openModAction = (action: "timeout" | "ban", target: { userId: string; userName: string }) =>
    setModAction({ action, ...target });
  const closeModAction = () => setModAction(null);
  function openNicknameEdit(login: string, _displayName: string, x: number, y: number) {
    setNicknameInput(feedUserNickname(login) ?? "");
    setNicknamePop({ x, y, login });
  }
  function closeNicknameEdit() {
    setNicknamePop(null);
    setNicknameInput("");
  }
  async function openUserContextMenu(
    x: number,
    y: number,
    identity: { userId?: string; login?: string; displayName?: string },
  ) {
    let { userId, login, displayName } = identity;
    if (!userId || !login || !displayName) {
      try {
        const params = userId ? { userIds: [userId] } : login ? { logins: [login] } : null;
        if (!params) return;
        const users = await getUsers(params);
        const u = users[0];
        if (!u) return;
        userId = u.id;
        login = u.login;
        displayName = u.display_name;
      } catch {
        return;
      }
    }
    setUserContextMenu({ x, y, userId, userLogin: login, userDisplayName: displayName });
  }
  const closeUserContextMenu = () => setUserContextMenu(null);
  function submitNicknameEdit() {
    const pop = nicknamePop();
    if (!pop) return;
    const v = nicknameInput().trim();
    if (v) setUserNickname(pop.login, v);
    else removeUserNickname(pop.login);
    closeNicknameEdit();
  }
  const clearReply = () => setReplyTo(null);
  const startReply = (msg: Message) => {
    setReplyTo({
      messageId: msg.message_id,
      name: msg.chatter_name,
      text: msg.fragments.map((f) => f.text).join(""),
    });
    inputApi?.focus();
  };

  function mentionUser(login: string) {
    inputApi?.insert(`@${login}`);
  }

  const items = createMemo<FeedItem[]>(() => feeds[props.broadcasterId]?.messages ?? []);
  const badges = createMemo(() => feeds[props.broadcasterId]?.badges ?? {});
  const paused = createMemo(() => feeds[props.broadcasterId]?.paused ?? false);
  const dividerAt = () => feeds[props.broadcasterId]?.dividerAtItemId ?? null;

  const emoteMap = createMemo(buildThirdPartyEmoteMap);
  const reactions = () => favorites().slice(0, 3);

  const isMod = () =>
    props.broadcasterLogin === props.userLogin ||
    moderatedChannels().some((c) => c.broadcaster_id === props.broadcasterId);

  const [fontSizeFlash, setFontSizeFlash] = createSignal(false);
  let fontSizeFlashTimer: number | undefined;

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

  function onWheel(e: WheelEvent) {
    if (!e.altKey || e.deltaY === 0) return;
    e.preventDefault();
    setFeedFontSize(feedFontSize() - Math.sign(e.deltaY));
    setFontSizeFlash(true);
    clearTimeout(fontSizeFlashTimer);
    fontSizeFlashTimer = window.setTimeout(() => setFontSizeFlash(false), 800);
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

  onCleanup(() => clearTimeout(fontSizeFlashTimer));

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
    sendChatMessage({
      broadcasterId: props.broadcasterId,
      message: value,
      replyParentMessageId: msg.message_id,
    });
  }

  function copypasta(msg: Message) {
    let fragments = msg.fragments;
    if (msg.reply) {
      const [first, ...rest] = fragments;
      if (first?.type === "mention" && first.user_login === msg.reply.parent_user_login) {
        if (rest[0]?.type === "text") {
          const trimmed = rest[0].text.trimStart();
          fragments = trimmed
            ? [{ ...rest[0], text: trimmed }, ...rest.slice(1)]
            : rest.slice(1);
        } else {
          fragments = rest;
        }
      }
    }
    const text = fragments.map((f) => f.text).join("");
    if (!text.trim()) return;
    sendChatMessage({
      broadcasterId: props.broadcasterId,
      message: text,
      replyParentMessageId: null,
    });
  }

  return (
    <div class="flex flex-col h-full bg-bg-dark">
      <div ref={rootRef} class="flex-1 relative min-h-0">
        <Show when={fontSizeFlash()}>
          <div class="absolute top-3 right-3 z-20 bg-bg border border-border-muted text-text text-base font-semibold px-3 py-1.5 rounded-lg shadow-lg pointer-events-none">
            {feedFontSize()}px
          </div>
        </Show>
        <Show when={paused()}>
          <button
            onClick={scrollToBottom}
            class="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-primary hover:bg-primary/80 text-text text-xs font-medium px-3 py-1.5 rounded-full shadow-lg transition-colors cursor-pointer"
          >
            <CaretDownIcon class="w-3 h-3" />
            Latest messages
          </button>
        </Show>
        <div
          ref={scrollRef}
          onScroll={onScroll}
          onWheel={onWheel}
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
                      keywords={feedKeywords()}
                      useDisplayName={feedUserShowDisplayName()}
                      overrideNameColor={feedUserOverrideNameColor()}
                      showTimestamp={feedShowTimestamp()}
                      showDeletedContent={feedShowDeletedContent()}
                      reactions={reactions()}
                      onContextMenu={openContextMenu}
                      onReply={startReply}
                      onReact={react}
                      onCopypasta={copypasta}
                      onUserContextMenu={openUserContextMenu}
                      onJumpToMessage={(messageId) => props.onJumpToMessage(props.broadcasterId, messageId)}
                      onShowUserCard={openUserCard}
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
        broadcasterLogin={props.broadcasterLogin}
        replyTo={replyTo}
        onClearReply={clearReply}
        expose={(api) => { inputApi = api; }}
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
          />
        )}
      </Show>
      <Show when={userContextMenu()}>
        {(uc) => (
          <UserContextMenu
            x={uc().x}
            y={uc().y}
            userId={uc().userId}
            userLogin={uc().userLogin}
            userDisplayName={uc().userDisplayName}
            isMod={isMod()}
            broadcasterId={props.broadcasterId}
            developerMode={advancedDeveloperMode()}
            onClose={closeUserContextMenu}
            onModAction={openModAction}
            onEditNickname={openNicknameEdit}
            onShowProfile={(x, y, userId) => setUserCard({ x, y, chatterId: userId })}
            onMention={mentionUser}
          />
        )}
      </Show>
      <Show when={userCard()}>
        {(uc) => (
          <UserCard
            x={uc().x}
            y={uc().y}
            chatterId={uc().chatterId}
            broadcasterId={props.broadcasterId}
            getBounds={() => rootRef?.getBoundingClientRect() ?? null}
            onClose={() => setUserCard(null)}
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
            userId={ma().userId}
            userName={ma().userName}
            broadcasterId={props.broadcasterId}
            onClose={closeModAction}
          />
        )}
      </Show>
      <Show when={nicknamePop()}>
        {(p) => (
          <InputPopover
            x={p().x}
            y={p().y}
            value={nicknameInput()}
            placeholder="Nickname"
            onInput={setNicknameInput}
            onSubmit={submitNicknameEdit}
            onClose={closeNicknameEdit}
          />
        )}
      </Show>
    </div>
  );
}
