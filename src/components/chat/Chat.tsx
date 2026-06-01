import { ChevronDown } from "lucide-solid";
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { sendChatMessage } from "../../lib/api/twitch/chat.ts";
import { loadBacklog } from "../../lib/services/feeds.ts";
import { shortcutManager } from "../../lib/managers/ShortcutManager.ts";
import { copyField } from "../../lib/utils/clipboard.ts";
import Feed, { type FeedApi } from "../feed/Feed.tsx";
import ChatInput from "./ChatInput.tsx";
import MessageContextMenu from "../context-menus/MessageContextMenu.tsx";
import UserContextMenu from "../context-menus/UserContextMenu.tsx";
import UserCard from "../user-card/UserCard.tsx";
import { getUsers } from "../../lib/api/twitch/users.ts";
import EventContextMenu from "../context-menus/EventContextMenu.tsx";
import BanModal from "../ban-modal/BanModal.tsx";
import InputPopover from "../ui/InputPopover.tsx";
import { moderatedChannels } from "../../lib/stores/users.ts";
import type { FeedMessage as Message, FeedEvent as EventItem } from "../../lib/types/index.ts";
import {
  setPaused as setFeedPaused,
  trimToLatest,
  markSeen,
  clearDivider,
} from "../../lib/stores/feeds.ts";
import {
  feedFontSize,
  advancedDeveloperMode,
  feedShowCopypasta,
  moderationActionsDisabled,
} from "../../lib/stores/preferences.ts";
import { createPopover } from "./createPopover.ts";
import { createNicknameEditor } from "./createNicknameEditor.ts";
import { createFontSizeWheel } from "./createFontSizeWheel.ts";

type Identity = { userId?: string; login?: string; displayName?: string };
type ResolvedIdentity = { userId: string; login: string; displayName: string };

type Props = {
  broadcasterId: string;
  broadcasterLogin: string;
  userLogin: string;
  isActive: boolean;
  onJumpToMessage: (channelId: string, messageId: string) => void;
};

async function resolveIdentity(identity: Identity): Promise<ResolvedIdentity | null> {
  const { userId, login, displayName } = identity;
  if (userId && login && displayName) return { userId, login, displayName };
  try {
    const params = userId ? { ids: [userId] } : login ? { logins: [login] } : null;
    if (!params) return null;
    const users = await getUsers(params);
    const u = users[0];
    if (!u) return null;
    return { userId: u.id, login: u.login, displayName: u.displayName };
  } catch {
    return null;
  }
}

export default function Chat(props: Props) {
  const messageMenu = createPopover<{ msg: Message }>();
  const userMenu = createPopover<{ userId: string; userLogin: string; userDisplayName: string }>();
  const eventMenu = createPopover<{ item: EventItem }>();
  const userCard = createPopover<{ chatterId: string }>();
  const nickname = createNicknameEditor();
  const fontSize = createFontSizeWheel();

  const [replyTo, setReplyTo] = createSignal<{ messageId: string; name: string; text: string } | null>(null);
  const [modAction, setModAction] = createSignal<{ userId: string; userName: string } | null>(null);
  const [feedApi, setFeedApi] = createSignal<FeedApi | null>(null);
  let inputApi: { focus: () => void; insert: (text: string) => void } | undefined;

  const isMod = createMemo(() =>
    !moderationActionsDisabled() &&
    (props.broadcasterLogin === props.userLogin ||
      moderatedChannels().some((c) => c.id === props.broadcasterId)),
  );

  onMount(() => loadBacklog(props.broadcasterId, props.broadcasterLogin));

  createEffect(() => {
    if (props.isActive) inputApi?.focus();
  });

  createEffect(() => {
    const api = feedApi();
    if (!api) return;
    setFeedPaused(props.broadcasterId, api.isPaused());
    if (props.isActive && !api.isPaused()) markSeen(props.broadcasterId);
  });

  createEffect(() => {
    feedFontSize();
    const api = feedApi();
    if (!api) return;
    requestAnimationFrame(() => { if (!api.isPaused()) api.scrollToBottom(); });
  });

  function startReply(msg: Message) {
    setReplyTo({
      messageId: msg.message_id,
      name: msg.chatter_name,
      text: msg.fragments.map((f) => f.text).join(""),
    });
    inputApi?.focus();
  }

  function clearReply() {
    setReplyTo(null);
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
      if (first.type === "mention" && first.user_login === msg.reply.parent_user_login) {
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

  async function openUserCard(x: number, y: number, identity: Identity) {
    const id = identity.userId ?? (await resolveIdentity(identity))?.userId;
    if (id) userCard.open(x, y, { chatterId: id });
  }

  async function openUserContextMenu(x: number, y: number, identity: Identity) {
    const r = await resolveIdentity(identity);
    if (r) userMenu.open(x, y, { userId: r.userId, userLogin: r.login, userDisplayName: r.displayName });
  }

  function openUserCardFromInput(userId: string) {
    const b = feedApi()?.getBounds();
    const x = b ? b.left : 0;
    const y = b ? b.bottom : window.innerHeight;
    userCard.open(x, y, { chatterId: userId });
  }

  const mentionUser = (login: string) => inputApi?.insert(`@${login}`);

  function bindFeedShortcuts() {
    const withSelected = (fn: (msg: Message) => void) => () => {
      const m = feedApi()?.getSelectedMessage();
      if (m) fn(m);
    };
    return [
      shortcutManager.registerLocal("shift-up", () => { feedApi()?.moveSelection(-1); }),
      shortcutManager.registerLocal("shift-down", () => { feedApi()?.moveSelection(1); }),
      shortcutManager.registerLocal("up", () => { feedApi()?.moveSelection(-1); }, "feedSelected"),
      shortcutManager.registerLocal("down", () => { feedApi()?.moveSelection(1); }, "feedSelected"),
      shortcutManager.registerLocal("escape", () => {
        feedApi()?.clearSelection();
        inputApi?.focus();
      }, "feedSelected"),
      shortcutManager.registerLocal("enter", withSelected(startReply), "feedSelected"),
      shortcutManager.registerLocal("c", withSelected((m) => {
        copyField(m.fragments.map((f) => f.text).join(""));
      }), "feedSelected"),
    ];
  }

  createEffect(() => {
    if (!props.isActive) return;
    const unbindDivider = shortcutManager.registerLocal("escape", () => {
      clearDivider(props.broadcasterId);
      return false;
    });
    const unbinds = bindFeedShortcuts();
    onCleanup(() => {
      unbindDivider();
      for (const u of unbinds) u();
    });
  });

  return (
    <div class="flex flex-col h-full bg-bg-dark">
      <Feed
        broadcasterId={props.broadcasterId}
        userLogin={props.userLogin}
        scrollClass="pl-2 pr-3"
        style={{ "font-size": `${feedFontSize()}px` }}
        onWheel={fontSize.onWheel}
        onContextMenu={(x, y, msg) => messageMenu.open(x, y, { msg })}
        onReply={startReply}
        onReact={react}
        onCopypasta={copypasta}
        onJumpToMessage={(messageId) => props.onJumpToMessage(props.broadcasterId, messageId)}
        onShowUserCard={openUserCard}
        onUserContextMenu={openUserContextMenu}
        onEventContextMenu={(x, y, item) => eventMenu.open(x, y, { item })}
        header={
          <Show when={fontSize.flash()}>
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
              <ChevronDown class="w-3 h-3" />
              Latest messages
            </button>
          </Show>
        }
        ref={setFeedApi}
      />

      <ChatInput
        broadcasterId={props.broadcasterId}
        broadcasterLogin={props.broadcasterLogin}
        isActive={props.isActive}
        replyTo={replyTo}
        onClearReply={clearReply}
        openUserCard={openUserCardFromInput}
        ref={(api) => { inputApi = api; }}
      />

      <Show when={messageMenu.state()}>
        {(cm) => (
          <MessageContextMenu
            x={cm().x}
            y={cm().y}
            msg={cm().msg}
            isMod={isMod()}
            broadcasterId={props.broadcasterId}
            developerMode={advancedDeveloperMode()}
            showCopypasta={feedShowCopypasta()}
            onClose={messageMenu.close}
            onReply={startReply}
            onCopypasta={copypasta}
          />
        )}
      </Show>
      <Show when={userMenu.state()}>
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
            onClose={userMenu.close}
            onModerate={(t) => setModAction(t)}
            onEditNickname={(login, _displayName, x, y) => nickname.open(login, x, y)}
            onShowProfile={(x, y, userId) => userCard.open(x, y, { chatterId: userId })}
            onMention={mentionUser}
          />
        )}
      </Show>
      <Show when={userCard.state()}>
        {(uc) => (
          <UserCard
            x={uc().x}
            y={uc().y}
            chatterId={uc().chatterId}
            broadcasterId={props.broadcasterId}
            getBounds={() => feedApi()?.getBounds() ?? null}
            getBoundsElement={() => feedApi()?.getElement() ?? null}
            onClose={userCard.close}
            onJumpToMessage={props.onJumpToMessage}
            onSwitchUser={async (identity) => {
              const id = identity.userId ?? (await resolveIdentity(identity))?.userId;
              if (id) userCard.update({ chatterId: id });
            }}
          />
        )}
      </Show>
      <Show when={eventMenu.state()}>
        {(cm) => (
          <EventContextMenu
            x={cm().x}
            y={cm().y}
            item={cm().item}
            developerMode={advancedDeveloperMode()}
            onClose={eventMenu.close}
          />
        )}
      </Show>
      <Show when={modAction()}>
        {(ma) => (
          <BanModal
            userId={ma().userId}
            userName={ma().userName}
            broadcasterId={props.broadcasterId}
            onClose={() => setModAction(null)}
          />
        )}
      </Show>
      <Show when={nickname.state()}>
        {(p) => (
          <InputPopover
            x={p().x}
            y={p().y}
            value={nickname.input()}
            placeholder="Nickname"
            onInput={nickname.setInput}
            onSubmit={nickname.submit}
            onClose={nickname.close}
          />
        )}
      </Show>
    </div>
  );
}
