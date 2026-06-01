import { Check, X } from "lucide-solid";
import { createSignal, For, Show } from "solid-js";
import { EmoteMap } from "../../lib/stores/emotes.ts";
import FeedMessageToolbar from "./FeedMessageToolbar.tsx";
import FeedMessageFragment from "./FeedMessageFragment.tsx";
import BadgeBox from "../ui/BadgeBox.tsx";
import DisplayName from "../ui/DisplayName.tsx";
import Timestamp from "../ui/Timestamp.tsx";
import RichNotice from "./RichNotice.tsx";
import type {
  BadgeMap,
  FeedMessage as Message,
} from "../../lib/types/index.ts";
import { matchesAnyKeyword } from "../../lib/stores/preferences.ts";
import { setAutomodHoldStatus } from "../../lib/stores/feeds.ts";
import {
  approveHeldAutomodMessage,
  denyHeldAutomodMessage,
} from "../../lib/api/twitch/moderation.ts";

type Reaction = { label: string; value: string; url: string };

type Props = {
  item: Message;
  emotes: EmoteMap;
  badges: BadgeMap;
  userLogin: string;
  keywords?: string[];
  showTimestamp?: boolean;
  showDeletedContent?: boolean;
  showName?: boolean;
  showBadges?: boolean;
  showToolbar?: boolean;
  reactions: Reaction[];
  onContextMenu?: (x: number, y: number, msg: Message) => void;
  onReply?: (msg: Message) => void;
  onReact?: (msg: Message, value: string) => void;
  onCopypasta?: (msg: Message) => void;
  onJumpToMessage?: (messageId: string) => void;
  onShowUserCard?: (
    x: number,
    y: number,
    identity: { userId?: string; login?: string },
  ) => void;
  onUserContextMenu?: (
    x: number,
    y: number,
    identity: { userId?: string; login?: string; displayName?: string },
  ) => void;
};

const HOLD_COLOR = "var(--color-warning)";

export default function FeedMessage(props: Props) {
  const hold = () => props.item.automod_hold;
  const holdPending = () => hold()?.status === "pending";
  const holdResolved = () => {
    const s = hold()?.status;
    return s === "approved" || s === "denied";
  };
  const [holdBusy, setHoldBusy] = createSignal(false);
  const [hovered, setHovered] = createSignal(false);

  async function handleHold(action: "approve" | "deny") {
    const h = hold();
    if (!h || holdBusy()) return;
    setHoldBusy(true);
    const broadcasterId = h.broadcaster_user_id;
    setAutomodHoldStatus(
      broadcasterId,
      props.item.message_id,
      action === "approve" ? "approving" : "denying",
    );
    try {
      if (action === "approve") {
        await approveHeldAutomodMessage({ msgId: props.item.message_id });
      } else {
        await denyHeldAutomodMessage({ msgId: props.item.message_id });
      }
      setAutomodHoldStatus(
        broadcasterId,
        props.item.message_id,
        action === "approve" ? "approved" : "denied",
      );
    } catch {
      setAutomodHoldStatus(broadcasterId, props.item.message_id, "pending");
    } finally {
      setHoldBusy(false);
    }
  }

  const mentioned = () => {
    if (
      props.item.fragments.some((f) =>
        f.type === "mention" && f.user_login === props.userLogin
      )
    ) {
      return true;
    }
    const kws = props.keywords;
    if (!kws || kws.length === 0) return false;
    const text = props.item.fragments.map((f) => f.text).join(" ");
    return matchesAnyKeyword(text, kws);
  };

  const visibleFragments = () => {
    const item = props.item;
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

  return (
    <div
      data-message-id={props.item.message_id}
      data-item-id={props.item.message_id}
      class={`relative group leading-[1.6] pl-2 pr-3 py-1 -mx-2 border-l-4 border-transparent rounded-r-md hover:bg-bg ${
        props.item.deleted || holdResolved() ? "opacity-50 " : ""
      }${
        hold()
          ? ""
          : mentioned()
          ? "bg-primary/10 border-primary! hover:bg-primary/15"
          : props.item.channel_points
          ? "bg-event-channel-points/10 border-event-channel-points! hover:bg-event-channel-points/15"
          : props.item.first_message
          ? "bg-border/25 border-highlight! hover:bg-border/40"
          : ""
      }`}
      style={hold()
        ? {
          "background-color":
            `color-mix(in oklab, ${HOLD_COLOR} 25%, transparent)`,
          "border-left-color": HOLD_COLOR,
        }
        : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={(e) => {
        if (!props.onContextMenu) return;
        e.preventDefault();
        e.stopPropagation();
        props.onContextMenu(e.clientX, e.clientY, props.item);
      }}
    >
      <Show
        when={hovered() &&
          !hold() &&
          props.showToolbar !== false &&
          props.onReply &&
          props.onReact &&
          props.onCopypasta &&
          props.onContextMenu}
      >
        <FeedMessageToolbar
          item={props.item}
          reactions={props.reactions}
          onReact={props.onReact!}
          onReply={props.onReply!}
          onCopypasta={props.onCopypasta!}
          onMore={props.onContextMenu!}
        />
      </Show>
      <div class="grid grid-cols-[auto_1fr]">
        <Show when={hold()}>
          <RichNotice
            class="col-start-2 row-start-1 text-warning text-[0.82em] leading-tight font-medium"
            label={hold()!.reason}
            suffix={holdResolved()
              ? (hold()!.status === "approved" ? "approved" : "denied")
              : undefined}
            actions={holdPending()
              ? [
                {
                  title: "Approve",
                  icon: () => <Check class="size-4" />,
                  variant: "success",
                  disabled: holdBusy,
                  onClick: () => handleHold("approve"),
                },
                {
                  title: "Deny",
                  icon: () => <X class="size-3" />,
                  variant: "danger",
                  disabled: holdBusy,
                  onClick: () => handleHold("deny"),
                },
              ]
              : undefined}
          />
        </Show>
        <Show when={props.item.channel_points_custom_reward}>
          <RichNotice
            class="col-start-2 row-start-1 text-event-channel-points text-[0.82em] leading-tight font-medium"
            label={props.item.channel_points_reward_title
              ? `Redeemed ${props.item.channel_points_reward_title}`
              : "Channel point redemption"}
          />
        </Show>
        <Show when={props.showTimestamp}>
          <Timestamp
            ts={props.item.timestamp}
            class="col-start-1 row-start-2 self-start text-text-muted select-none shrink-0 mr-2"
          />
        </Show>
        <div class="col-start-2 row-start-2 wrap-break-word min-w-0">
          <Show when={props.item.reply}>
            <div
              class={`text-text-muted/70 leading-[1.6em] truncate transition-colors ${
                props.onJumpToMessage
                  ? "cursor-pointer hover:text-text-muted"
                  : ""
              }`}
              onClick={() =>
                props.onJumpToMessage?.(props.item.reply!.parent_message_id)}
            >
              <span class="text-[0.78em]">⌐ Replying to</span>
              <span class="text-[0.78em] font-semibold text-primary">
                @{props.item.reply!.parent_user_name}
              </span>
              <span class="text-[0.78em]">
                : {props.item.reply!.parent_message_body}
              </span>
            </div>
          </Show>
          <Show when={props.showBadges !== false}>
            <BadgeBox
              badges={props.item.badges}
              channelBadges={props.badges}
              class="mr-1.5 align-text-bottom"
            />
          </Show>
          <Show when={props.showName !== false}>
            <DisplayName
              login={props.item.chatter_login}
              displayName={props.item.chatter_name}
              color={props.item.color}
              userId={props.item.chatter_user_id}
              onShowUserCard={props.onShowUserCard}
              onUserContextMenu={props.onUserContextMenu}
            />
            <span class="text-text-muted">:</span>
          </Show>
          <Show
            when={!props.item.deleted || props.showDeletedContent}
            fallback={
              <span class="italic text-text-muted">&lt;deleted&gt;</span>
            }
          >
            <For each={visibleFragments()}>
              {(frag) => (
                <FeedMessageFragment
                  frag={frag}
                  emotes={props.emotes}
                  onShowUserCard={props.onShowUserCard}
                  onUserContextMenu={props.onUserContextMenu}
                />
              )}
            </For>
          </Show>
        </div>
      </div>
    </div>
  );
}
