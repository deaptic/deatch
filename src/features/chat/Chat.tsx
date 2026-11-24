import Boundary from "../../kit/Boundary.tsx";
import { t } from "../../shared/i18n/index.ts";
import {
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  Show,
} from "solid-js";
import * as chat from "./send.ts";
import {
  mentionsIn,
  textOf,
  withoutReplyMention,
  Feed,
  type FeedApi,
  feeds,
  unseenCount,
  markSeen,
  setPaused as setFeedPaused,
  trimToLatest,
} from "../feed/index.ts";
import ScrollStatusBar from "./ui/ScrollStatusBar.tsx";
import { Composer, type ComposerApi, type ReplyTo } from "../composer/index.ts";
import { showsControls } from "../permissions/index.ts";
import type { FeedMessage as Message } from "../feed/index.ts";
import {
  feedDensity,
  feedFontSize,
  highlightWords,
} from "../preferences/index.ts";
import { createFontSizeWheel } from "./createFontSizeWheel.ts";
import { createFeedShortcuts } from "./createFeedShortcuts.ts";
import { createModShortcuts } from "./createModShortcuts.ts";
import SelectionHints from "./SelectionHints.tsx";
import { createChatOverlays } from "./createChatOverlays.ts";
import ChatOverlays from "./ChatOverlays.tsx";
import Transition from "../../kit/Transition.tsx";
import { PeopleDialog } from "../people/index.ts";
import { closeOverlay, isOverlayOpen } from "../navigation/index.ts";

type Props = {
  broadcasterId: string;
  broadcasterLogin: string;
  broadcasterName: string;
  userLogin: string;
  onOpenChannel: (broadcasterId: string) => void;
  onJumpToMessage: (broadcasterId: string, messageId: string) => void;
};

export default function Chat(props: Props) {
  const overlays = createChatOverlays();
  const fontSize = createFontSizeWheel();
  const [replyTo, setReplyTo] = createSignal<ReplyTo | null>(null);
  const [feedApi, setFeedApi] = createSignal<FeedApi | null>(null);
  let inputApi: ComposerApi | undefined;

  const isMod = createMemo(() =>
    showsControls(props.broadcasterId, "moderate"),
  );

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

  createFeedShortcuts({
    broadcasterId: () => props.broadcasterId,
    feed: feedApi,
    reply: startReply,
    openUserCard: (m, bounds) =>
      void overlays.openUserCard(bounds.left, bounds.bottom, {
        id: m.chatter_user_id,
        login: m.chatter_login,
      }),
    focusInput: () => inputApi?.focus(),
  });
  const mod = createModShortcuts({
    broadcasterId: () => props.broadcasterId,
    feed: feedApi,
  });

  const getMentions = () =>
    mentionsIn(
      feeds[props.broadcasterId]?.messages ?? [],
      props.userLogin,
      highlightWords(),
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

  const jumpToMessage = (messageId: string) =>
    props.onJumpToMessage(props.broadcasterId, messageId);

  function jumpToLatest() {
    trimToLatest(props.broadcasterId);
    feedApi()?.scrollToBottom();
  }

  function openUserCardFromInput(userId: string) {
    const b = feedApi()?.getBounds();
    overlays.userCards.open(
      b ? b.left : 0,
      b ? b.bottom : window.innerHeight,
      userId,
    );
  }

  return (
    <div class="relative flex-1 min-h-0 flex flex-col">
      <Boundary label={t("FEED_BOUNDARY_ERROR")}>
        <Feed
          broadcasterId={props.broadcasterId}
          userLogin={props.userLogin}
          scrollClass="pr-4 py-1 scrollbar-inset"
          flush
          density={feedDensity()}
          class="text-(length:--chat-size)"
          onWheel={fontSize.onWheel}
          onContextMenu={(x, y, msg) =>
            overlays.messageMenu.open(x, y, { msg })
          }
          onReply={startReply}
          onReact={react}
          onCopypasta={copypasta}
          onJumpToMessage={jumpToMessage}
          onOpenChannel={props.onOpenChannel}
          onShowUserCard={overlays.openUserCard}
          onUserContextMenu={overlays.openUserMenu}
          onEventContextMenu={(x, y, item) =>
            overlays.eventMenu.open(x, y, { item })
          }
          ref={setFeedApi}
        />
      </Boundary>

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
        <Show when={feedApi()?.getSelectedMessage()}>
          {(selected) => (
            <SelectionHints
              moderator={mod.canModerate(selected())}
              moderating={mod.armed()?.chatter_name ?? null}
            />
          )}
        </Show>
        <Boundary>
          <Composer
            broadcasterId={props.broadcasterId}
            broadcasterName={props.broadcasterName}
            replyTo={replyTo}
            onClearReply={() => setReplyTo(null)}
            getMentions={getMentions}
            onReplyMention={startReply}
            openUserCard={openUserCardFromInput}
            ref={(api) => {
              inputApi = api;
              api.focus();
            }}
          />
        </Boundary>
      </div>

      <Transition when={isMod() && isOverlayOpen("chatters")}>
        {() => (
          <Boundary silent>
            <PeopleDialog
              broadcasterId={props.broadcasterId}
              onClose={closeOverlay}
              onShowUserCard={overlays.openUserCard}
              onUserContextMenu={overlays.openUserMenu}
            />
          </Boundary>
        )}
      </Transition>

      <Boundary silent>
        <ChatOverlays
          overlays={overlays}
          broadcasterId={props.broadcasterId}
          broadcasterLogin={props.broadcasterLogin}
          isMod={isMod()}
          feed={feedApi()}
          onReply={startReply}
          onCopypasta={copypasta}
          onMention={(login) => inputApi?.insert(`@${login}`)}
          onJumpToMessage={jumpToMessage}
          onOpenChannel={props.onOpenChannel}
        />
      </Boundary>
    </div>
  );
}
