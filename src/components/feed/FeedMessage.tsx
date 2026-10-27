import { Check, ClipboardPaste, Ellipsis, Reply, X } from "lucide-solid";
import { createEffect, createMemo, For, type JSX, Show } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import type { EmoteMap } from "../../lib/stores/emotes.ts";
import type { CheermoteMap } from "../../lib/utils/cheermote.ts";
import type {
  AutomodHoldInfo,
  BadgeMap,
  FeedMessage as Message,
  Reaction,
} from "../../lib/types/index.ts";
import type { Density } from "../../lib/constants/density.ts";
import { isMention } from "../../lib/utils/mention.ts";
import { withoutReplyMention } from "../../lib/utils/message.ts";
import { avatarZoom } from "../../lib/utils/avatar.ts";
import * as automod from "../../lib/services/automod.ts";
import * as users from "../../lib/services/users.ts";
import { formatSuspicious } from "../../lib/format/suspicious.ts";
import { sourceBadges } from "../../lib/stores/sourceBadges.ts";
import { feedShowCopypasta } from "../../lib/stores/preferences.ts";
import { knownChatterColor, knownUser } from "../../lib/stores/users.ts";
import BadgeBox, { type BadgePlacement } from "../ui/BadgeBox.tsx";
import ChatterPicture, { chatterLook } from "../ui/ChatterPicture.tsx";
import DisplayName from "../ui/DisplayName.tsx";
import Fragments from "../ui/Fragments.tsx";
import { OVERLAY_GAP } from "../ui/Popover.tsx";
import Timestamp from "../ui/Timestamp.tsx";
import Toolbar from "../ui/Toolbar.tsx";
import ToolbarItem, { type ToolbarTone } from "../ui/ToolbarItem.tsx";
import { type UserActions, userLink, userLinkHover } from "../ui/userLink.ts";
import { createChannelLink } from "../context-menus/createChannelLink.tsx";
import FeedItem, { type ItemLayout, type RowTone } from "./FeedItem.tsx";

export type MessageOptions = UserActions & {
  emotes: EmoteMap;
  cheermotes: CheermoteMap;
  badges: BadgeMap;
  userLogin: string;
  reactions: Reaction[];
  keywords?: string[];
  showDeletedContent?: boolean;
  showName?: boolean;
  showBadges?: boolean;
  showToolbar?: boolean;
  highlightMentions?: boolean;
  onContextMenu?: (x: number, y: number, msg: Message) => void;
  onReply?: (msg: Message) => void;
  onReact?: (msg: Message, value: string) => void;
  onCopypasta?: (msg: Message) => void;
  onJumpToMessage?: (messageId: string) => void;
  onOpenChannel?: (channelId: string) => void;
};

type Props = ItemLayout & MessageOptions & { item: Message };

type LabelAction = {
  title: string;
  icon: () => JSX.Element;
  onClick: () => void;
  tone?: ToolbarTone;
};

function holdOutcome(hold: AutomodHoldInfo): string {
  return hold.moderator
    ? t("FEED_AUTOMOD_STATUS_BY", { status: hold.status, mod: hold.moderator })
    : t("FEED_AUTOMOD_STATUS", { status: hold.status });
}

export default function FeedMessage(props: Props) {
  const item = props.item;
  const hold = () => item.automod_hold;
  const holdPending = () => hold()?.status === "pending";
  const holdResolved = () => {
    const s = hold()?.status;
    return s === "approved" || s === "denied" || s === "expired";
  };

  const comfortable = () =>
    props.density === "comfortable" && props.showName !== false;
  const density = (): Density => comfortable() ? "comfortable" : "compact";

  function handleHold(action: automod.HoldAction) {
    const h = hold();
    if (h) void automod.resolve(h.broadcaster_user_id, item.message_id, action);
  }

  const mentioned = createMemo(() =>
    isMention(item, props.userLogin, props.keywords ?? [])
  );

  const tone = (): RowTone =>
    hold()
      ? "held"
      : props.highlightMentions !== false && mentioned()
      ? "mention"
      : item.cheer || item.power_up
      ? "cheer"
      : item.channel_points
      ? "redemption"
      : item.first_message
      ? "first"
      : "plain";

  const pointsLabel = (): string | undefined => {
    const points = item.channel_points;
    if (!points) return undefined;
    if (points.kind !== "custom_reward") {
      return t("FEED_MESSAGE_PERK", { perk: points.kind });
    }
    return points.redemption
      ? t("FEED_REDEEMED_REWARD", {
        reward: points.redemption.reward.title,
        cost: points.redemption.reward.cost,
      })
      : t("FEED_REDEEMED_CHANNEL_POINTS");
  };

  // A partner chatter wears the badges of the channel they chatted in, which
  // fall back to this channel's map (global badges) until that set loads.
  const chatterBadges = () => item.source?.badges ?? item.badges;
  const badgeMap = () =>
    (item.source && sourceBadges[item.source.id]) || props.badges;

  // Spacious rows pin the source channel to the avatar instead.
  const badges = (placement: BadgePlacement) => (
    <BadgeBox
      badges={props.showBadges !== false ? chatterBadges() : []}
      channelBadges={badgeMap()}
      placement={placement}
    >
      <Show when={!comfortable() && item.source}>
        {(source) => (
          <SourceChannel source={source()} onOpen={props.onOpenChannel} />
        )}
      </Show>
    </BadgeBox>
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
      fallback={
        <span class="italic text-ink-soft">{t("FEED_MESSAGE_DELETED")}</span>
      }
    >
      <span class={item.deleted ? "text-ink-faint *:text-ink-faint" : ""}>
        <Fragments
          fragments={withoutReplyMention(item)}
          emotes={props.emotes}
          cheermotes={props.cheermotes}
          mentionsYou={mentioned()}
          onShowUserCard={props.onShowUserCard}
          onUserContextMenu={props.onUserContextMenu}
        />
      </span>
      <Show when={item.deleted}>
        <span class="ml-1.5 feed-meta text-ink-faint select-none">
          (deleted)
        </span>
      </Show>
    </Show>
  );

  const avatar = (active: () => boolean) => (
    <span
      class={`relative shrink-0 grid ${userLinkHover(props)}`}
      {...userLink(
        () => ({
          id: item.chatter_user_id,
          login: item.chatter_login,
          displayName: item.chatter_name,
        }),
        props,
      )}
    >
      <FeedItem.Tile round color={chatterLook(item.color).tint}>
        <ChatterPicture
          userId={item.chatter_user_id}
          color={item.color}
          active={active()}
        />
      </FeedItem.Tile>
      <Show when={item.source}>
        {(source) => (
          <span class="absolute -bottom-1 -right-1 flex rounded-full ring-3 ring-canvas">
            <SourceChannel
              source={source()}
              round
              onOpen={props.onOpenChannel}
            />
          </span>
        )}
      </Show>
    </span>
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

  return (
    <FeedItem
      id={item.message_id}
      timestamp={item.timestamp}
      density={density()}
      continued={props.continued}
      selected={props.selected}
      flush={props.flush}
      bare={props.bare}
      showTimestamp={props.showTimestamp}
      tone={tone()}
      dimmed={holdResolved()}
      tile={comfortable() ? avatar : undefined}
      overlay={toolbar}
      onContextMenu={props.onContextMenu &&
        ((x, y) => props.onContextMenu!(x, y, item))}
    >
      <FeedItem.Context
        thread={item.reply && (
          <ReplyLine
            reply={item.reply}
            showAvatar={comfortable()}
            onJump={props.onJumpToMessage}
            onShowUserCard={props.onShowUserCard}
            onUserContextMenu={props.onUserContextMenu}
          />
        )}
      >
        <Show when={hold()}>
          {(h) => (
            <Label
              class="text-caution"
              label={t("FEED_AUTOMOD_HELD", { reason: h().reason })}
              suffix={holdResolved() ? holdOutcome(h()) : undefined}
              actions={holdPending()
                ? [
                  {
                    title: t("FEED_AUTOMOD_APPROVE"),
                    icon: () => <Check class="size-4" />,
                    tone: "success",
                    onClick: () => handleHold("approve"),
                  },
                  {
                    title: t("FEED_AUTOMOD_DENY"),
                    icon: () => <X class="size-4" />,
                    tone: "danger",
                    onClick: () => handleHold("deny"),
                  },
                ]
                : undefined}
            />
          )}
        </Show>
        <Show when={item.suspicious}>
          {(suspicious) => (
            <Label
              class="text-caution"
              label={formatSuspicious(suspicious())}
            />
          )}
        </Show>
        <Show when={item.cheer}>
          {(cheer) => (
            <Label
              class="text-event-bits"
              label={t("FEED_CHEERED", { bits: cheer().bits })}
            />
          )}
        </Show>
        <Show when={item.power_up}>
          {(perk) => (
            <Label
              class="text-event-bits"
              label={t("FEED_MESSAGE_PERK", { perk: perk() })}
            />
          )}
        </Show>
        <Show when={pointsLabel()}>
          {(label) => (
            <Label class="text-event-channel-points" label={label()} />
          )}
        </Show>
        <Show when={item.first_message && !hold()}>
          <Label class="text-ink-soft" label={t("FEED_FIRST_MESSAGE")} />
        </Show>
      </FeedItem.Context>
      <Show when={comfortable() && !props.continued}>
        <FeedItem.Title>
          {name()}
          {badges("after")}
          <Timestamp ts={item.timestamp} format="c" variant="inline" />
        </FeedItem.Title>
      </Show>
      <FeedItem.Content>
        <Show when={!comfortable()}>
          {badges("before")}
          <Show when={props.showName !== false}>
            {name()}
            <span class="text-ink-soft">:</span>
            {" "}
          </Show>
        </Show>
        {body()}
      </FeedItem.Content>
    </FeedItem>
  );
}

function Label(
  props: {
    label: string;
    class: string;
    actions?: LabelAction[];
    suffix?: string;
  },
) {
  return (
    <>
      <div
        class={`feed-meta leading-tight font-semibold mb-0.5 ${props.class}`}
      >
        {props.label}
        <Show when={props.suffix}>
          <span class="text-ink-soft font-medium">{` · ${props.suffix}`}</span>
        </Show>
      </div>
      <Show when={props.actions?.length}>
        <Toolbar alwaysVisible>
          <For each={props.actions}>
            {(action) => (
              <ToolbarItem
                title={action.title}
                tone={action.tone}
                onClick={action.onClick}
              >
                {action.icon()}
              </ToolbarItem>
            )}
          </For>
        </Toolbar>
      </Show>
    </>
  );
}

function ReplyLine(
  props: UserActions & {
    reply: NonNullable<Message["reply"]>;
    showAvatar: boolean;
    onJump?: (messageId: string) => void;
  },
) {
  const parentColor = () => knownChatterColor(props.reply.parent_user_id) ?? "";
  const parent = () => ({
    id: props.reply.parent_user_id,
    login: props.reply.parent_user_login,
    displayName: props.reply.parent_user_name,
  });
  // A direct reply to the thread's first message needs no second pointer.
  const threadStart = () => {
    const r = props.reply;
    if (!r.thread_message_id || r.thread_message_id === r.parent_message_id) {
      return null;
    }
    const name = r.thread_user_name || r.thread_user_login;
    return name ? { id: r.thread_message_id, name } : null;
  };

  return (
    <div
      class={`flex items-center gap-1.5 min-w-0 text-ink-faint feed-meta transition-colors duration-snap ${
        props.onJump ? "cursor-pointer hover:text-ink-soft" : ""
      }`}
      onClick={() => props.onJump?.(props.reply.parent_message_id)}
    >
      <Show when={props.showAvatar && props.reply.parent_user_id}>
        {(id) => {
          const look = () => chatterLook(parentColor());
          return (
            <span
              class={`h-lh aspect-square shrink-0 grid overflow-hidden rounded-full ${
                look().tint ? "bg-(--tile)/16" : "bg-raised"
              } ${userLinkHover(props)}`}
              style={look().tint ? { "--tile": look().tint } : undefined}
              {...userLink(parent, props)}
            >
              <ChatterPicture userId={id()} color={parentColor()} />
            </span>
          );
        }}
      </Show>
      <span class="shrink-0">
        <DisplayName
          prefix="@"
          login={props.reply.parent_user_login}
          displayName={props.reply.parent_user_name}
          color={parentColor()}
          userId={props.reply.parent_user_id}
          onShowUserCard={props.onShowUserCard}
          onUserContextMenu={props.onUserContextMenu}
        />
      </span>
      <span class="truncate" data-tip={props.reply.parent_message_body}>
        {props.reply.parent_message_body}
      </span>
      <Show when={threadStart()}>
        {(thread) => (
          <span
            class="shrink-0 hover:text-ink-soft"
            onClick={(e) => {
              e.stopPropagation();
              props.onJump?.(thread().id);
            }}
          >
            {t("FEED_REPLY_THREAD", { user: thread().name })}
          </span>
        )}
      </Show>
    </div>
  );
}

/// The channel a shared chat message was sent in, as a badge tile.
function SourceChannel(
  props: {
    source: NonNullable<Message["source"]>;
    /// Round on a chatter tile; square among the badges.
    round?: boolean;
    onOpen?: (channelId: string) => void;
  },
) {
  createEffect(() => {
    users.get([props.source.id]).catch((e) =>
      console.warn("shared chat channel lookup failed", e)
    );
  });

  const channel = () => knownUser(props.source.id);
  // History messages carry only the channel id.
  const name = () =>
    props.source.name || channel()?.displayName || props.source.login;
  const link = createChannelLink(
    channel,
    props.onOpen && (() => props.onOpen!(props.source.id)),
  );

  return (
    <span
      data-tip={name()
        ? t("FEED_SENT_IN_CHAT", { channel: name() })
        : t("FEED_SENT_IN_SHARED_CHAT")}
      {...link.handlers}
      class={`feed-badge grid overflow-hidden bg-ink/15 ${link.cursor} ${
        props.round ? "rounded-full" : "rounded-xs"
      }`}
    >
      <Show when={channel()?.profileImageUrl}>
        {(src) => (
          <img
            src={src()}
            {...avatarZoom(src())}
            alt={name()}
            class="size-full object-cover"
          />
        )}
      </Show>
      {link.menu()}
    </span>
  );
}

function MessageToolbar(
  props: {
    item: Message;
    reactions: Reaction[];
    onReact: (msg: Message, value: string) => void;
    onReply: (msg: Message) => void;
    onCopypasta: (msg: Message) => void;
    onMore: (x: number, y: number, msg: Message) => void;
  },
) {
  return (
    <Toolbar>
      <For each={props.reactions}>
        {(r) => (
          <ToolbarItem
            title={r.label}
            onClick={() => props.onReact(props.item, r.value)}
          >
            <img src={r.url} alt={r.label} class="size-5 object-contain" />
          </ToolbarItem>
        )}
      </For>
      <ToolbarItem
        title={t("MESSAGE_REPLY")}
        onClick={() => props.onReply(props.item)}
      >
        <Reply />
      </ToolbarItem>
      <Show when={feedShowCopypasta()}>
        <ToolbarItem
          title={t("MESSAGE_COPYPASTA")}
          onClick={() => props.onCopypasta(props.item)}
        >
          <ClipboardPaste />
        </ToolbarItem>
      </Show>
      <ToolbarItem
        title={t("FEED_MORE_OPTIONS")}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          props.onMore(rect.left, rect.bottom + OVERLAY_GAP, props.item);
        }}
      >
        <Ellipsis />
      </ToolbarItem>
    </Toolbar>
  );
}
