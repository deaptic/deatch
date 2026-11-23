import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import * as chat from "./send.ts";
import {
  backlog,
  mentionsIn,
  textOf,
  withoutReplyMention,
  Feed,
  type FeedApi,
  clearDivider,
  feeds,
  unseenCount,
  markSeen,
  setPaused as setFeedPaused,
  trimToLatest,
} from "../feed/index.ts";
import * as shortcuts from "../../shared/keyboard/shortcuts.ts";
import * as clipboard from "../../kit/clipboard.ts";
import ScrollStatusBar from "./ScrollStatusBar.tsx";
import { Composer, type ComposerApi, type ReplyTo } from "../composer/index.ts";
import {
  MessageContextMenu,
  UserContextMenu,
  type ModAction,
  EventContextMenu,
} from "../menus/index.ts";
import { BanModal, UserCard, WarnModal } from "../user-card/index.ts";
import { createUserCards } from "./createUserCards.ts";
import { users } from "../users/index.ts";
import { showsControls } from "../permissions/index.ts";
import type {
  FeedEvent as EventItem,
  FeedMessage as Message,
  UserRef,
} from "../../lib/types/index.ts";
import {
  advancedDeveloperMode,
  feedDensity,
  feedFontSize,
  feedKeywords,
  feedShowCopypasta,
} from "../preferences/index.ts";
import { createPopover } from "../../kit/createPopover.ts";
import { createFontSizeWheel } from "./createFontSizeWheel.ts";
import Transition from "../../kit/Transition.tsx";
import { PeopleDialog } from "../people/index.ts";
import { closeOverlay, isOverlayOpen } from "../../lib/stores/ui.ts";

type Props = {
  broadcasterId: string;
  broadcasterLogin: string;
  broadcasterName: string;
  userLogin: string;
  onOpenChannel: (broadcasterId: string) => void;
  onJumpToMessage: (broadcasterId: string, messageId: string) => void;
};

export default function Chat(props: Props) {
  const messageMenu = createPopover<{ msg: Message }>();
  const userMenu = createPopover<{
    userId: string;
    userLogin: string;
    userDisplayName: string;
  }>();
  const eventMenu = createPopover<{ item: EventItem }>();
  const userCards = createUserCards();
  const fontSize = createFontSizeWheel();

  const [replyTo, setReplyTo] = createSignal<ReplyTo | null>(null);
  const [modAction, setModAction] = createSignal<{
    action: ModAction;
    userId: string;
    userName: string;
  } | null>(null);
  const [feedApi, setFeedApi] = createSignal<FeedApi | null>(null);
  let inputApi: ComposerApi | undefined;

  const isMod = createMemo(() =>
    showsControls(props.broadcasterId, "moderate"),
  );

  onMount(() => backlog.load(props.broadcasterId, props.broadcasterLogin));

  createEffect(
    on(
      () => feedApi()?.isPaused(),
      (paused) => {
        if (paused === undefined) return;
        setFeedPaused(props.broadcasterId, paused);
        if (!paused) markSeen(props.broadcasterId);
      },
    ),
  );
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

  const getMentions = () =>
    mentionsIn(
      feeds[props.broadcasterId]?.messages ?? [],
      props.userLogin,
      feedKeywords(),
    );

  function react(msg: Message, value: string) {
    void chat.send({
      broadcasterId: props.broadcasterId,
      message: value,
      replyParentMessageId: msg.message_id,
    });
  }

  function copypasta(msg: Message) {
    const text = textOf({ fragments: withoutReplyMention(msg) }).trim();
    if (text) inputApi?.replace(text);
  }

  function jumpToMessage(messageId: string) {
    props.onJumpToMessage(props.broadcasterId, messageId);
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
    const id = await users.resolveId(identity);
    if (id) userCards.open(x, y, id);
  }

  async function openUserContextMenu(
    x: number,
    y: number,
    identity: Partial<UserRef>,
  ) {
    const r = await users.resolve(identity);
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
      if (!m) return shortcuts.PASS;
      fn(m);
    };
    return [
      shortcuts.register("feed::selectPrev", () => {
        feedApi()?.moveSelection(-1);
      }),
      shortcuts.register("feed::selectNext", () => {
        feedApi()?.moveSelection(1);
      }),
      shortcuts.registerLocal(
        "up",
        () => {
          feedApi()?.moveSelection(-1);
        },
        "feedSelected",
      ),
      shortcuts.registerLocal(
        "down",
        () => {
          feedApi()?.moveSelection(1);
        },
        "feedSelected",
      ),
      shortcuts.registerLocal(
        "escape",
        () => {
          feedApi()?.clearSelection();
          inputApi?.focus();
        },
        "feedSelected",
      ),
      shortcuts.registerLocal(
        "enter",
        withSelected(startReply),
        "feedSelected",
      ),
      shortcuts.register(
        "feed::reply",
        withSelected(startReply),
        "feedSelected",
      ),
      shortcuts.register(
        "feed::copy",
        withSelected((m) => clipboard.copy(textOf(m))),
        "feedSelected",
      ),
    ];
  }

  onMount(() => {
    const unbindDivider = shortcuts.registerLocal("escape", () => {
      clearDivider(props.broadcasterId);
      return shortcuts.PASS;
    });
    const unbinds = bindFeedShortcuts();
    onCleanup(() => {
      unbindDivider();
      for (const u of unbinds) u();
    });
  });

  return (
    <div class="relative flex-1 min-h-0 flex flex-col">
      <Feed
        broadcasterId={props.broadcasterId}
        userLogin={props.userLogin}
        scrollClass="pr-4 py-1 scrollbar-inset"
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
        ref={setFeedApi}
      />

      <div class="relative z-20 shrink-0 bg-surface border-t border-line-soft">
        <Transition when={feedApi()?.isPaused()}>
          {() => (
            <div class="absolute inset-x-0 bottom-full enter-rise">
              <ScrollStatusBar
                unseen={unseenCount(props.broadcasterId)}
                onJump={jumpToLatest}
              />
            </div>
          )}
        </Transition>
        <Composer
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
      </div>

      <Transition when={isMod() && isOverlayOpen("chatters")}>
        {() => (
          <PeopleDialog
            broadcasterId={props.broadcasterId}
            onClose={closeOverlay}
            onShowUserCard={openUserCard}
            onUserContextMenu={openUserContextMenu}
          />
        )}
      </Transition>

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
            onModerate={(action, target) => setModAction({ action, ...target })}
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
              userCards.update(card.key, { pinned: !card.pinned })
            }
            onJumpToMessage={jumpToMessage}
            onOpenChannel={props.onOpenChannel}
            onUserContextMenu={openUserContextMenu}
            onSwitchUser={async (identity) => {
              const id = await users.resolveId(identity);
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
      <Transition when={modAction()}>
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
      </Transition>
    </div>
  );
}
