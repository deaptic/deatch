import { Check, X } from "lucide-solid";
import { createMemo, createSignal, For, Show } from "solid-js";
import type { EmoteMap } from "../../../lib/stores/emotes.ts";
import type {
  BadgeMap,
  FeedMessage,
  UserRef,
} from "../../../lib/types/index.ts";
import type { Density } from "../../../lib/constants/density.ts";
import { matchesAnyKeyword } from "../../../lib/utils/wordMatch.ts";
import { setAutomodHoldStatus } from "../../../lib/stores/feeds.ts";
import { manageHeldAutomodMessage } from "../../../lib/api/twitch/moderation.ts";
import BadgeBox, { type BadgePlacement } from "../../ui/BadgeBox.tsx";
import DisplayName from "../../ui/DisplayName.tsx";
import Timestamp from "../../ui/Timestamp.tsx";
import type {
  Annotation,
  ItemLayout,
  ItemParts,
  RowTone,
} from "../itemParts.ts";
import ChatterAvatar from "./ChatterAvatar.tsx";
import MessageFragment from "./MessageFragment.tsx";
import MessageToolbar from "./MessageToolbar.tsx";
import ReplyLine from "./ReplyLine.tsx";
import RichNotice from "./RichNotice.tsx";
import type { Reaction } from "./reaction.ts";

export type MessageOptions = {
  emotes: EmoteMap;
  badges: BadgeMap;
  userLogin: string;
  reactions: Reaction[];
  keywords?: string[];
  showDeletedContent?: boolean;
  showName?: boolean;
  showBadges?: boolean;
  showToolbar?: boolean;
  onContextMenu?: (x: number, y: number, msg: FeedMessage) => void;
  onReply?: (msg: FeedMessage) => void;
  onReact?: (msg: FeedMessage, value: string) => void;
  onCopypasta?: (msg: FeedMessage) => void;
  onJumpToMessage?: (messageId: string) => void;
  onShowUserCard?: (x: number, y: number, identity: Partial<UserRef>) => void;
  onUserContextMenu?: (
    x: number,
    y: number,
    identity: Partial<UserRef>,
  ) => void;
};

export function createMessageParts(
  item: FeedMessage,
  props: ItemLayout & MessageOptions,
): ItemParts {
  const hold = () => item.automod_hold;
  const holdPending = () => hold()?.status === "pending";
  const holdResolved = () => {
    const s = hold()?.status;
    return s === "approved" || s === "denied" || s === "expired";
  };
  const [holdBusy, setHoldBusy] = createSignal(false);

  const comfortable = () =>
    props.density === "comfortable" && props.showName !== false;

  async function handleHold(action: "approve" | "deny") {
    const h = hold();
    if (!h || holdBusy()) return;
    setHoldBusy(true);
    const broadcasterId = h.broadcaster_user_id;
    setAutomodHoldStatus(
      broadcasterId,
      item.message_id,
      action === "approve" ? "approving" : "denying",
    );
    try {
      await manageHeldAutomodMessage({
        msgId: item.message_id,
        action: action === "approve" ? "allow" : "deny",
      });
      setAutomodHoldStatus(
        broadcasterId,
        item.message_id,
        action === "approve" ? "approved" : "denied",
      );
    } catch {
      setAutomodHoldStatus(broadcasterId, item.message_id, "pending");
    } finally {
      setHoldBusy(false);
    }
  }

  const mentioned = () => {
    if (
      item.fragments.some((f) =>
        f.type === "mention" && f.user_login === props.userLogin
      )
    ) {
      return true;
    }
    const kws = props.keywords;
    if (!kws || kws.length === 0) return false;
    const text = item.fragments.map((f) => f.text).join(" ");
    return matchesAnyKeyword(text, kws);
  };

  const tone = (): RowTone =>
    hold()
      ? "held"
      : mentioned()
      ? "mention"
      : item.channel_points
      ? "redemption"
      : item.first_message
      ? "first"
      : "plain";

  const visibleFragments = () => {
    if (!item.reply) return item.fragments;
    const [first, ...rest] = item.fragments;
    if (
      first?.type === "mention" &&
      first.user_login === item.reply.parent_user_login
    ) {
      if (rest[0]?.type === "text") {
        const trimmed = rest[0].text.trimStart();
        return trimmed
          ? [{ ...rest[0], text: trimmed }, ...rest.slice(1)]
          : rest.slice(1);
      }
      return rest;
    }
    return item.fragments;
  };

  const holdNotice = () => (
    <RichNotice
      class="text-caution"
      label={`Held by AutoMod · ${hold()!.reason}`}
      suffix={holdResolved()
        ? (hold()!.status === "approved"
          ? "approved"
          : hold()!.status === "denied"
          ? "denied"
          : "expired")
        : undefined}
      actions={holdPending()
        ? [
          {
            title: "Approve",
            icon: () => <Check class="size-4" />,
            tone: "success",
            disabled: holdBusy,
            onClick: () => handleHold("approve"),
          },
          {
            title: "Deny",
            icon: () => <X class="size-4" />,
            tone: "danger",
            disabled: holdBusy,
            onClick: () => handleHold("deny"),
          },
        ]
        : undefined}
    />
  );

  const annotations = createMemo((): Annotation[] => {
    const list: Annotation[] = [];
    if (hold()) list.push({ content: holdNotice() });
    if (item.channel_points?.kind === "custom_reward") {
      const title = item.channel_points.title;
      list.push({
        content: (
          <RichNotice
            class="text-event-channel-points"
            label={title ? `Redeemed ${title}` : "Redeemed channel points"}
          />
        ),
      });
    }
    if (item.first_message && !hold()) {
      list.push({
        content: <RichNotice class="text-ink-soft" label="First message" />,
      });
    }
    if (item.reply) {
      list.push({
        connector: true,
        content: (
          <ReplyLine
            reply={item.reply}
            showAvatar={comfortable()}
            onJump={props.onJumpToMessage}
          />
        ),
      });
    }
    return list;
  });

  const badges = (placement: BadgePlacement) => (
    <Show when={props.showBadges !== false}>
      <BadgeBox
        badges={item.badges}
        channelBadges={props.badges}
        placement={placement}
      />
    </Show>
  );

  const name = () => (
    <DisplayName
      login={item.chatter_login}
      displayName={item.chatter_name}
      color={item.color}
      userId={item.chatter_user_id}
      onShowUserCard={props.onShowUserCard}
      onUserContextMenu={props.onUserContextMenu}
    />
  );

  const body = () => (
    <Show
      when={!item.deleted || props.showDeletedContent}
      fallback={<span class="italic text-ink-soft">Message deleted</span>}
    >
      <For each={visibleFragments()}>
        {(frag) => (
          <MessageFragment
            frag={frag}
            emotes={props.emotes}
            mentionsYou={mentioned()}
            onShowUserCard={props.onShowUserCard}
            onUserContextMenu={props.onUserContextMenu}
          />
        )}
      </For>
    </Show>
  );

  const avatar = (active: () => boolean) => (
    <ChatterAvatar
      userId={item.chatter_user_id}
      color={item.color}
      active={active()}
      onClick={props.onShowUserCard &&
        ((x, y) =>
          props.onShowUserCard!(x, y, {
            id: item.chatter_user_id,
            login: item.chatter_login,
            displayName: item.chatter_name,
          }))}
    />
  );

  const toolbar = (hovered: () => boolean) => (
    <Show
      when={hovered() &&
        !hold() &&
        props.showToolbar !== false &&
        props.onReply &&
        props.onReact &&
        props.onCopypasta &&
        props.onContextMenu}
    >
      <MessageToolbar
        item={item}
        reactions={props.reactions}
        onReact={props.onReact!}
        onReply={props.onReply!}
        onCopypasta={props.onCopypasta!}
        onMore={props.onContextMenu!}
      />
    </Show>
  );

  const content = (
    <Show
      when={comfortable()}
      fallback={
        <>
          {badges("before")}
          <Show when={props.showName !== false}>
            {name()}
            <span class="text-ink-soft">:</span>
            {" "}
          </Show>
          {body()}
        </>
      }
    >
      <Show when={!props.continued}>
        <div>
          {name()}
          {badges("after")}
          <Timestamp ts={item.timestamp} format="c" variant="inline" />
        </div>
      </Show>
      {body()}
    </Show>
  );

  return {
    get density(): Density {
      return comfortable() ? "comfortable" : "compact";
    },
    get tone() {
      return tone();
    },
    get dimmed() {
      return !!item.deleted || holdResolved();
    },
    get annotations() {
      return annotations();
    },
    get tile() {
      return comfortable() ? avatar : undefined;
    },
    overlay: toolbar,
    content,
    get onContextMenu() {
      return props.onContextMenu &&
        ((x: number, y: number) => props.onContextMenu!(x, y, item));
    },
  };
}
