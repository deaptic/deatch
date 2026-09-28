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
import type { Reaction } from "./reaction.ts";
import type { UserRef } from "../../lib/types/twitch/user.ts";
import { setAutomodHoldStatus } from "../../lib/stores/feeds.ts";
import {
  approveHeldAutomodMessage,
  denyHeldAutomodMessage,
} from "../../lib/api/twitch/moderation.ts";

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
  selected?: boolean;
  reactions: Reaction[];
  onContextMenu?: (x: number, y: number, msg: Message) => void;
  onReply?: (msg: Message) => void;
  onReact?: (msg: Message, value: string) => void;
  onCopypasta?: (msg: Message) => void;
  onJumpToMessage?: (messageId: string) => void;
  onShowUserCard?: (x: number, y: number, identity: Partial<UserRef>) => void;
  onUserContextMenu?: (
    x: number,
    y: number,
    identity: Partial<UserRef>,
  ) => void;
};

type Treatment = "held" | "mention" | "redemption" | "first" | "plain";

const TREATMENTS: Record<Treatment, string> = {
  held: "border-caution bg-caution/12 hover:bg-caution/16",
  mention: "border-accent bg-accent-soft hover:bg-accent/18",
  redemption:
    "border-event-channel-points bg-event-channel-points/10 hover:bg-event-channel-points/14",
  first: "border-line bg-surface hover:bg-raised",
  plain: "border-transparent hover:bg-surface",
};

export default function FeedMessage(props: Props) {
  const hold = () => props.item.automod_hold;
  const holdPending = () => hold()?.status === "pending";
  const holdResolved = () => {
    const s = hold()?.status;
    return s === "approved" || s === "denied" || s === "expired";
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

  const treatment = (): Treatment =>
    hold()
      ? "held"
      : mentioned()
      ? "mention"
      : props.item.channel_points
      ? "redemption"
      : props.item.first_message
      ? "first"
      : "plain";

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
      class={`relative group leading-normal pl-3 pr-2 py-1 border-l-3 rounded-r-sm transition-colors duration-snap ${
        TREATMENTS[treatment()]
      } ${
        props.selected
          ? "bg-accent-soft! outline outline-2 -outline-offset-2 outline-accent rounded-sm"
          : ""
      } ${props.item.deleted || holdResolved() ? "opacity-50" : ""}`}
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
      <div class="flex items-start">
        <Show when={props.showTimestamp}>
          <Timestamp ts={props.item.timestamp} feed />
        </Show>
        <div class="flex-1 min-w-0 wrap-break-word">
          <Show when={hold()}>
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
          </Show>
          <Show
            when={props.item.channel_points?.kind === "custom_reward"
              ? props.item.channel_points
              : undefined}
          >
            {(cp) => (
              <RichNotice
                class="text-event-channel-points"
                label={cp().title
                  ? `Redeemed ${cp().title}`
                  : "Redeemed channel points"}
              />
            )}
          </Show>
          <Show when={props.item.reply}>
            <div
              class={`text-ink-faint feed-meta truncate transition-colors duration-snap ${
                props.onJumpToMessage
                  ? "cursor-pointer hover:text-ink-soft"
                  : ""
              }`}
              onClick={() =>
                props.onJumpToMessage?.(props.item.reply!.parent_message_id)}
            >
              ↰ Replying to{" "}
              <span class="font-semibold text-accent-ink">
                @{props.item.reply!.parent_user_name}
              </span>
              : {props.item.reply!.parent_message_body}
            </div>
          </Show>
          <Show when={props.showBadges !== false}>
            <BadgeBox badges={props.item.badges} channelBadges={props.badges} />
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
            <Show when={props.item.first_message && !hold()}>
              <span class="feed-chip inline-flex items-center ml-1.5 rounded-full bg-raised text-ink-soft font-semibold">
                First message
              </span>
            </Show>
            <span class="text-ink-soft">:</span>
            {" "}
          </Show>
          <Show
            when={!props.item.deleted || props.showDeletedContent}
            fallback={<span class="italic text-ink-soft">Message deleted</span>}
          >
            <For each={visibleFragments()}>
              {(frag) => (
                <FeedMessageFragment
                  frag={frag}
                  emotes={props.emotes}
                  mentionsYou={mentioned()}
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
