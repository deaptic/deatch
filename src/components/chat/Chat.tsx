import { ChevronDown } from "lucide-solid";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import * as chat from "../../lib/services/chat.ts";
import * as backlog from "../../lib/services/backlog.ts";
import * as shortcuts from "../../lib/services/shortcuts.ts";
import { copyField } from "../../lib/utils/clipboard.ts";
import { isMention } from "../../lib/utils/mention.ts";
import { textOf, withoutReplyMention } from "../../lib/utils/message.ts";
import Feed, { type FeedApi } from "../feed/Feed.tsx";
import ChatInput, { type ChatInputApi, type ReplyTo } from "./ChatInput.tsx";
import RaidBanner from "./RaidBanner.tsx";
import ModBar from "./ModBar.tsx";
import ConnectionBanner from "./ConnectionBanner.tsx";
import { chatConnected } from "../../lib/stores/eventsub.ts";
import { pendingRaid } from "../../lib/stores/raid.ts";
import MessageContextMenu from "../context-menus/MessageContextMenu.tsx";
import UserContextMenu, {
  type ModAction,
} from "../context-menus/UserContextMenu.tsx";
import WarnModal from "../warn-modal/WarnModal.tsx";
import UserCard from "../user-card/UserCard.tsx";
import { createUserCards } from "./createUserCards.ts";
import * as users from "../../lib/services/users.ts";
import EventContextMenu from "../context-menus/EventContextMenu.tsx";
import BanModal from "../ban-modal/BanModal.tsx";
import { isModOfChannel } from "../../lib/stores/users.ts";
import type {
  FeedEvent as EventItem,
  FeedMessage as Message,
} from "../../lib/types/index.ts";
import {
  clearDivider,
  feeds,
  markSeen,
  setPaused as setFeedPaused,
  trimToLatest,
} from "../../lib/stores/feeds.ts";
import { addToast } from "../../lib/stores/toasts.ts";
import {
  advancedDeveloperMode,
  feedDensity,
  feedFontSize,
  feedKeywords,
  feedShowCopypasta,
  moderationActionsDisabled,
} from "../../lib/stores/preferences.ts";
import { createPopover } from "./createPopover.ts";
import { createFontSizeWheel } from "./createFontSizeWheel.ts";
import type { UserRef } from "../../lib/types/index.ts";

type Props = {
  broadcasterId: string;
  broadcasterLogin: string;
  broadcasterName: string;
  userLogin: string;
  onOpenChannel: (channelId: string) => void;
  onJumpToMessage: (channelId: string, messageId: string) => void;
};

async function resolveIdentity(
  identity: Partial<UserRef>,
): Promise<UserRef | null> {
  const { id, login, displayName } = identity;
  if (id && login && displayName) return { id, login, displayName };
  try {
    const [u] = id
      ? await users.get([id])
      : login
      ? await users.fetch({ logins: [login] })
      : [];
    if (!u) return null;
    return { id: u.id, login: u.login, displayName: u.displayName };
  } catch {
    return null;
  }
}

export default function Chat(props: Props) {
  const messageMenu = createPopover<{ msg: Message }>();
  const userMenu = createPopover<
    { userId: string; userLogin: string; userDisplayName: string }
  >();
  const eventMenu = createPopover<{ item: EventItem }>();
  const userCards = createUserCards();
  const fontSize = createFontSizeWheel();

  const [replyTo, setReplyTo] = createSignal<ReplyTo | null>(null);
  const [modAction, setModAction] = createSignal<
    { action: ModAction; userId: string; userName: string } | null
  >(null);
  const [feedApi, setFeedApi] = createSignal<FeedApi | null>(null);
  let inputApi: ChatInputApi | undefined;

  const isMod = createMemo(() =>
    !moderationActionsDisabled() && isModOfChannel(props.broadcasterId)
  );

  onMount(() => backlog.load(props.broadcasterId, props.broadcasterLogin));

  createEffect(() => {
    const api = feedApi();
    if (!api) return;
    setFeedPaused(props.broadcasterId, api.isPaused());
    if (!api.isPaused()) markSeen(props.broadcasterId);
  });
  onCleanup(() => setFeedPaused(props.broadcasterId, false));

  createEffect(() => {
    feedFontSize();
    feedDensity();
    const api = feedApi();
    if (!api) return;
    requestAnimationFrame(() => {
      if (!api.isPaused()) api.scrollToBottom();
    });
  });

  function startReply(msg: Message) {
    setReplyTo({
      messageId: msg.message_id,
      name: msg.chatter_name,
      text: textOf(msg),
    });
    inputApi?.focus();
  }

  function clearReply() {
    setReplyTo(null);
  }

  function getMentions(): Message[] {
    const kws = feedKeywords();
    const msgs = feeds[props.broadcasterId]?.messages ?? [];
    const out: Message[] = [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      if (m.kind === "message" && isMention(m, props.userLogin, kws)) {
        out.push(m);
      }
    }
    return out;
  }

  function react(msg: Message, value: string) {
    chat.send({
      broadcasterId: props.broadcasterId,
      message: value,
      replyParentMessageId: msg.message_id,
    });
  }

  function copypasta(msg: Message) {
    const text = textOf({ fragments: withoutReplyMention(msg) }).trim();
    if (text) inputApi?.replace(text);
  }

  // This feed is mounted with its backlog, so a message it lacks never arrives.
  function jumpToMessage(messageId: string): boolean {
    const held = feeds[props.broadcasterId]?.messages.some((m) =>
      m.kind === "message" && m.message_id === messageId
    );
    if (!held) {
      addToast("That message is no longer in chat");
      return false;
    }
    props.onJumpToMessage(props.broadcasterId, messageId);
    return true;
  }

  function jumpToLatest() {
    trimToLatest(props.broadcasterId);
    feedApi()?.scrollToBottom();
  }

  async function openUserCard(
    x: number,
    y: number,
    identity: Partial<UserRef>,
  ) {
    const id = identity.id ?? (await resolveIdentity(identity))?.id;
    if (id) userCards.open(x, y, id);
  }

  async function openUserContextMenu(
    x: number,
    y: number,
    identity: Partial<UserRef>,
  ) {
    const r = await resolveIdentity(identity);
    if (r) {
      userMenu.open(x, y, {
        userId: r.id,
        userLogin: r.login,
        userDisplayName: r.displayName,
      });
    }
  }

  function openUserCardFromInput(userId: string) {
    const b = feedApi()?.getBounds();
    const x = b ? b.left : 0;
    const y = b ? b.bottom : window.innerHeight;
    userCards.open(x, y, userId);
  }

  const mentionUser = (login: string) => inputApi?.insert(`@${login}`);

  function bindFeedShortcuts() {
    const withSelected = (fn: (msg: Message) => void) => () => {
      const m = feedApi()?.getSelectedMessage();
      if (m) fn(m);
    };
    return [
      shortcuts.registerLocal("shift-up", () => {
        feedApi()?.moveSelection(-1);
      }),
      shortcuts.registerLocal("shift-down", () => {
        feedApi()?.moveSelection(1);
      }),
      shortcuts.registerLocal("up", () => {
        feedApi()?.moveSelection(-1);
      }, "feedSelected"),
      shortcuts.registerLocal("down", () => {
        feedApi()?.moveSelection(1);
      }, "feedSelected"),
      shortcuts.registerLocal("escape", () => {
        feedApi()?.clearSelection();
        inputApi?.focus();
      }, "feedSelected"),
      shortcuts.registerLocal(
        "enter",
        withSelected(startReply),
        "feedSelected",
      ),
      shortcuts.registerLocal(
        "r",
        withSelected(startReply),
        "feedSelected",
      ),
      shortcuts.registerLocal(
        "c",
        withSelected((m) => copyField(textOf(m))),
        "feedSelected",
      ),
    ];
  }

  createEffect(() => {
    const unbindDivider = shortcuts.registerLocal("escape", () => {
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
    <div class="flex-1 min-h-0 flex flex-col">
      <Show when={isMod()}>
        <ModBar
          broadcasterId={props.broadcasterId}
          isBroadcaster={props.broadcasterLogin === props.userLogin}
        />
      </Show>
      <Show
        when={pendingRaid()}
        fallback={
          <Show when={!chatConnected()}>
            <ConnectionBanner />
          </Show>
        }
      >
        {(raid) => <RaidBanner raid={raid()} />}
      </Show>
      <Feed
        broadcasterId={props.broadcasterId}
        userLogin={props.userLogin}
        scrollClass="pr-4 py-2"
        flush
        density={feedDensity()}
        class="text-(length:--chat-size)"
        onWheel={fontSize.onWheel}
        onContextMenu={(x, y, msg) => messageMenu.open(x, y, { msg })}
        onReply={startReply}
        onReact={react}
        onCopypasta={copypasta}
        onJumpToMessage={jumpToMessage}
        onOpenChannel={props.onOpenChannel}
        onShowUserCard={openUserCard}
        onUserContextMenu={openUserContextMenu}
        onEventContextMenu={(x, y, item) => eventMenu.open(x, y, { item })}
        footer={
          <Show when={feedApi()?.isPaused()}>
            <button
              onClick={jumpToLatest}
              class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 h-8 pl-2.5 pr-3.5 bg-accent hover:bg-accent-hover text-on-accent text-small font-semibold rounded-full transition-colors duration-snap cursor-pointer"
            >
              <ChevronDown class="size-4" />
              New messages
            </button>
          </Show>
        }
        ref={setFeedApi}
      />

      <ChatInput
        broadcasterId={props.broadcasterId}
        broadcasterName={props.broadcasterName}
        replyTo={replyTo}
        onClearReply={clearReply}
        getMentions={getMentions}
        onReplyMention={startReply}
        openUserCard={openUserCardFromInput}
        ref={(api) => {
          inputApi = api;
          api.focus();
        }}
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
            onJumpToMessage={jumpToMessage}
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
            onModerate={(action, t) => setModAction({ action, ...t })}
            onShowProfile={(x, y, userId) => userCards.open(x, y, userId)}
            onMention={mentionUser}
          />
        )}
      </Show>
      <For each={userCards.cards}>
        {(card) => (
          <UserCard
            x={card.x}
            y={card.y}
            chatterId={card.chatterId}
            broadcasterId={props.broadcasterId}
            broadcasterLogin={props.broadcasterLogin}
            pinned={card.pinned}
            getBounds={() => feedApi()?.getBounds() ?? null}
            getBoundsElement={() => feedApi()?.getElement() ?? null}
            onClose={() => userCards.close(card.key)}
            onTogglePin={() =>
              userCards.update(card.key, { pinned: !card.pinned })}
            onJumpToMessage={jumpToMessage}
            onOpenChannel={props.onOpenChannel}
            onUserContextMenu={openUserContextMenu}
            onSwitchUser={async (identity) => {
              const id = identity.id ??
                (await resolveIdentity(identity))?.id;
              if (id) userCards.update(card.key, { chatterId: id });
            }}
          />
        )}
      </For>
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
          <Show
            when={ma().action !== "warn"}
            fallback={
              <WarnModal
                userId={ma().userId}
                userName={ma().userName}
                broadcasterId={props.broadcasterId}
                onClose={() => setModAction(null)}
              />
            }
          >
            <BanModal
              userId={ma().userId}
              userName={ma().userName}
              broadcasterId={props.broadcasterId}
              onClose={() => setModAction(null)}
            />
          </Show>
        )}
      </Show>
    </div>
  );
}
