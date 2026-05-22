import {
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { sendChatMessage } from "../../commands/chat";
import { loadBacklog } from "../../services/feeds";
import { shortcutManager } from "../../managers/ShortcutManager";
import { copyField } from "../../utils/clipboard";
import Feed, { type FeedApi } from "../feed/Feed";
import ChatInput from "./ChatInput";
import MessageContextMenu from "../context-menus/MessageContextMenu";
import UserContextMenu, { type UserContextTarget } from "../context-menus/UserContextMenu";
import UserCard from "../user-card/UserCard";
import { getUsers } from "../../commands/users";
import EventContextMenu from "../context-menus/EventContextMenu";
import BanModal from "../ban-modal/BanModal";
import InputPopover from "../../ui/InputPopover";
import { moderatedChannels } from "../../state/users";
import type { FeedMessage as Message, FeedEvent as EventItem } from "../../types";
import {
  setPaused as setFeedPaused,
  trimToLatest,
  markSeen,
  clearDivider,
} from "../../state/feeds";
import {
  feedFontSize,
  setFeedFontSize,
  feedUserNickname,
  setUserNickname,
  removeUserNickname,
  advancedDeveloperMode,
  feedShowCopypasta,
  moderationActionsDisabled,
} from "../../state/preferences";
import CaretDownIcon from "../../icons/CaretDownIcon";

type Props = {
  broadcasterId: string;
  broadcasterLogin: string;
  userLogin: string;
  onJumpToMessage: (channelId: string, messageId: string) => void;
};

export default function Chat(props: Props) {
  const [contextMenu, setContextMenu] = createSignal<{ x: number; y: number; msg: Message } | null>(null);
  const [userContextMenu, setUserContextMenu] = createSignal<{ x: number; y: number } & UserContextTarget | null>(null);
  const [eventContextMenu, setEventContextMenu] = createSignal<{ x: number; y: number; item: EventItem } | null>(null);
  const [replyTo, setReplyTo] = createSignal<{ messageId: string; name: string; text: string } | null>(null);
  const [modAction, setModAction] = createSignal<{ userId: string; userName: string } | null>(null);
  const [userCard, setUserCard] = createSignal<{ x: number; y: number; chatterId: string } | null>(null);
  const [nicknamePop, setNicknamePop] = createSignal<{ x: number; y: number; login: string } | null>(null);
  const [nicknameInput, setNicknameInput] = createSignal("");
  const [feedApi, setFeedApi] = createSignal<FeedApi | null>(null);
  const [fontSizeFlash, setFontSizeFlash] = createSignal(false);

  let inputApi: { focus: () => void; insert: (text: string) => void } | undefined;
  let fontSizeFlashTimer: number | undefined;

  createEffect(on(() => props.broadcasterId, () => {
    inputApi?.focus();
  }));

  createEffect(on(() => props.broadcasterId, (broadcasterId) => {
    loadBacklog(broadcasterId, props.broadcasterLogin);
  }));

  const isMod = () =>
    !moderationActionsDisabled() &&
    (props.broadcasterLogin === props.userLogin ||
      moderatedChannels().some((c) => c.broadcaster_id === props.broadcasterId));

  createEffect(() => {
    const api = feedApi();
    if (!api) return;
    setFeedPaused(props.broadcasterId, api.isPaused());
    if (!api.isPaused()) markSeen(props.broadcasterId);
  });

  createEffect(() => {
    feedFontSize();
    const api = feedApi();
    if (!api) return;
    requestAnimationFrame(() => { if (!api.isPaused()) api.scrollToBottom(); });
  });

  onMount(() => {
    const unbind = shortcutManager.registerLocal("escape", () => {
      clearDivider(props.broadcasterId);
      return false;
    });
    onCleanup(unbind);
  });

  onMount(() => {
    const withSelected = (fn: (msg: Message) => void) => () => {
      const m = feedApi()?.getSelectedMessage();
      if (m) fn(m);
    };
    const unbinds = [
      shortcutManager.registerLocal("shift-up", () => { feedApi()?.moveSelection(-1); }),
      shortcutManager.registerLocal("shift-down", () => { feedApi()?.moveSelection(1); }),
      shortcutManager.registerLocal("up", () => { feedApi()?.moveSelection(-1); }, "feedSelected"),
      shortcutManager.registerLocal("down", () => { feedApi()?.moveSelection(1); }, "feedSelected"),
      shortcutManager.registerLocal("escape", () => {
        feedApi()?.clearSelection();
        inputApi?.focus();
      }, "feedSelected"),
      shortcutManager.registerLocal("enter", withSelected((m) => startReply(m)), "feedSelected"),
      shortcutManager.registerLocal("c", withSelected((m) => {
        copyField(m.fragments.map((f) => f.text).join(""));
      }), "feedSelected"),
    ];
    onCleanup(() => { for (const u of unbinds) u(); });
  });

  onCleanup(() => clearTimeout(fontSizeFlashTimer));

  function onWheel(e: WheelEvent) {
    if (!e.altKey || e.deltaY === 0) return;
    e.preventDefault();
    setFeedFontSize(feedFontSize() - Math.sign(e.deltaY));
    setFontSizeFlash(true);
    clearTimeout(fontSizeFlashTimer);
    fontSizeFlashTimer = window.setTimeout(() => setFontSizeFlash(false), 800);
  }

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
  const openModerate = (target: { userId: string; userName: string }) => setModAction(target);
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
  const mentionUser = (login: string) => inputApi?.insert(`@${login}`);

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

  function jumpToLatest() {
    trimToLatest(props.broadcasterId);
    feedApi()?.scrollToBottom();
  }

  function openUserCardFromInput(userId: string) {
    const b = feedApi()?.getBounds();
    const x = b ? b.left : 0;
    const y = b ? b.bottom : window.innerHeight;
    setUserCard({ x, y, chatterId: userId });
  }

  return (
    <div class="flex flex-col h-full bg-bg-dark">
      <Feed
        broadcasterId={props.broadcasterId}
        userLogin={props.userLogin}
        scrollClass="pl-2 pr-3"
        style={{ "font-size": `${feedFontSize()}px` }}
        onWheel={onWheel}
        onContextMenu={openContextMenu}
        onReply={startReply}
        onReact={react}
        onCopypasta={copypasta}
        onJumpToMessage={(messageId) => props.onJumpToMessage(props.broadcasterId, messageId)}
        onShowUserCard={openUserCard}
        onUserContextMenu={openUserContextMenu}
        onEventContextMenu={openEventContextMenu}
        header={
          <Show when={fontSizeFlash()}>
            <div class="absolute top-3 right-3 z-20 bg-bg border border-border-muted text-text text-base font-semibold px-3 py-1.5 rounded-lg shadow-lg pointer-events-none">
              {feedFontSize()}px
            </div>
          </Show>
        }
        footer={
          <Show when={feedApi()?.isPaused()}>
            <button
              onClick={jumpToLatest}
              class="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-primary hover:bg-primary/80 text-text text-xs font-medium px-3 py-1.5 rounded-full shadow-lg transition-colors cursor-pointer"
            >
              <CaretDownIcon class="w-3 h-3" />
              Latest messages
            </button>
          </Show>
        }
        expose={(api) => setFeedApi(api)}
      />

      <ChatInput
        broadcasterId={props.broadcasterId}
        broadcasterLogin={props.broadcasterLogin}
        replyTo={replyTo}
        onClearReply={clearReply}
        openUserCard={openUserCardFromInput}
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
            showCopypasta={feedShowCopypasta()}
            onClose={closeContextMenu}
            onReply={startReply}
            onCopypasta={copypasta}
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
            onModerate={openModerate}
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
            getBounds={() => feedApi()?.getBounds() ?? null}
            getBoundsElement={() => feedApi()?.getElement() ?? null}
            onClose={() => setUserCard(null)}
            onJumpToMessage={props.onJumpToMessage}
            onSwitchUser={async (identity) => {
              let id = identity.userId;
              if (!id && identity.login) {
                try {
                  const users = await getUsers({ logins: [identity.login] });
                  id = users[0]?.id;
                } catch {
                  return;
                }
              }
              if (id) setUserCard((u) => (u ? { ...u, chatterId: id! } : null));
            }}
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
          <BanModal
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
