import { Check, X } from "lucide-solid";
import { createSignal, For, type JSX, Show } from "solid-js";
import { EmoteMap } from "../../lib/stores/emotes.ts";
import FeedMessageToolbar from "./FeedMessageToolbar.tsx";
import FeedMessageFragment from "./FeedMessageFragment.tsx";
import FeedAvatar from "./FeedAvatar.tsx";
import FeedReply from "./FeedReply.tsx";
import FeedAnnotation from "./FeedAnnotation.tsx";
import BadgeBox, { type BadgePlacement } from "../ui/BadgeBox.tsx";
import DisplayName from "../ui/DisplayName.tsx";
import Timestamp from "../ui/Timestamp.tsx";
import RichNotice from "./RichNotice.tsx";
import type {
  BadgeMap,
  FeedMessage as Message,
} from "../../lib/types/index.ts";
import type { Density } from "../../lib/constants/density.ts";
import { matchesAnyKeyword } from "../../lib/utils/wordMatch.ts";
import type { Reaction } from "./reaction.ts";
import type { UserRef } from "../../lib/types/index.ts";
import { setAutomodHoldStatus } from "../../lib/stores/feeds.ts";
import { manageHeldAutomodMessage } from "../../lib/api/twitch/moderation.ts";

type Props = {
  item: Message;
  emotes: EmoteMap;
  badges: BadgeMap;
  userLogin: string;
  keywords?: string[];
  density?: Density;
  continued?: boolean;
  showTimestamp?: boolean;
  showDeletedContent?: boolean;
  showName?: boolean;
  showBadges?: boolean;
  showToolbar?: boolean;
  flush?: boolean;
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
  first: "border-line bg-surface hover:bg-overlay",
  plain: "border-transparent hover:bg-raised",
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

  const comfortable = () =>
    props.density === "comfortable" && props.showName !== false;
  const density = (): Density => comfortable() ? "comfortable" : "compact";
  const spacerTimestamp = () =>
    !comfortable() && props.showTimestamp ? props.item.timestamp : undefined;

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
      await manageHeldAutomodMessage({
        msgId: props.item.message_id,
        action: action === "approve" ? "allow" : "deny",
      });
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

  const spacing = () =>
    !comfortable() ? "py-1" : props.continued ? "py-0.5" : "pt-2 pb-0.5";

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

  const annotate = (notice: JSX.Element) => (
    <FeedAnnotation density={density()} timestamp={spacerTimestamp()}>
      {notice}
    </FeedAnnotation>
  );

  const notices = () => (
    <>
      <Show when={hold()}>
        {annotate(
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
          />,
        )}
      </Show>
      <Show
        when={props.item.channel_points?.kind === "custom_reward"
          ? props.item.channel_points
          : undefined}
      >
        {(cp) =>
          annotate(
            <RichNotice
              class="text-event-channel-points"
              label={cp().title
                ? `Redeemed ${cp().title}`
                : "Redeemed channel points"}
            />,
          )}
      </Show>
      <Show when={props.item.first_message && !hold()}>
        {annotate(<RichNotice class="text-ink-soft" label="First message" />)}
      </Show>
    </>
  );

  const badges = (placement: BadgePlacement) => (
    <Show when={props.showBadges !== false}>
      <BadgeBox
        badges={props.item.badges}
        channelBadges={props.badges}
        placement={placement}
      />
    </Show>
  );

  const name = () => (
    <DisplayName
      login={props.item.chatter_login}
      displayName={props.item.chatter_name}
      color={props.item.color}
      userId={props.item.chatter_user_id}
      onShowUserCard={props.onShowUserCard}
      onUserContextMenu={props.onUserContextMenu}
    />
  );

  const body = () => (
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
  );

  const compactBody = () => (
    <div class="flex items-start">
      <Show when={props.showTimestamp}>
        <Timestamp ts={props.item.timestamp} variant="column" />
      </Show>
      <div class="flex-1 min-w-0 wrap-break-word">
        {badges("before")}
        <Show when={props.showName !== false}>
          {name()}
          <span class="text-ink-soft">:</span>
          {" "}
        </Show>
        {body()}
      </div>
    </div>
  );

  const comfortableBody = () => (
    <div
      class={`flex gap-3 ${props.continued ? "items-baseline" : "items-start"}`}
    >
      <Show
        when={!props.continued}
        fallback={
          <span class="w-(--chat-tile) shrink-0 flex justify-center">
            <Timestamp
              ts={props.item.timestamp}
              variant="gutter"
            />
          </span>
        }
      >
        <span class="relative w-(--chat-tile) h-lh shrink-0">
          <Show when={props.item.reply}>
            <span class="absolute left-1/2 top-0 bottom-0 border-l-2 border-line" />
          </Show>
          <span class="absolute left-0 top-full -translate-y-1/2">
            <FeedAvatar
              userId={props.item.chatter_user_id}
              active={hovered() || !!props.selected}
              onClick={props.onShowUserCard &&
                ((x, y) =>
                  props.onShowUserCard!(x, y, {
                    id: props.item.chatter_user_id,
                    login: props.item.chatter_login,
                    displayName: props.item.chatter_name,
                  }))}
            />
          </span>
        </span>
      </Show>
      <div class="flex-1 min-w-0 wrap-break-word">
        <Show when={!props.continued}>
          <div>
            {name()}
            {badges("after")}
            <Timestamp
              ts={props.item.timestamp}
              format="c"
              variant="inline"
            />
          </div>
        </Show>
        {body()}
      </div>
    </div>
  );

  return (
    <div
      data-message-id={props.item.message_id}
      data-item-id={props.item.message_id}
      class={`relative group leading-normal pl-3 pr-2 ${spacing()} border-l-3 transition-colors duration-snap ${
        props.flush ? "rounded-r-sm" : "rounded-sm"
      } ${TREATMENTS[treatment()]} ${
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
      {notices()}
      <Show when={props.item.reply}>
        {(reply) => (
          <FeedReply
            reply={reply()}
            density={density()}
            timestamp={spacerTimestamp()}
            onJump={props.onJumpToMessage}
          />
        )}
      </Show>
      <Show when={comfortable()} fallback={compactBody()}>
        {comfortableBody()}
      </Show>
    </div>
  );
}
