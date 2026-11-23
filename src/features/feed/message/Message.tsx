import { Check, X } from "lucide-solid";
import { createMemo, Show } from "solid-js";
import { t } from "../../../shared/i18n/index.ts";
import { type EmoteMap, type CheermoteMap } from "../../emotes/index.ts";
import type {
  AutomodAction,
  BadgeMap,
  FeedMessage,
  Reaction,
} from "../../../shared/types/index.ts";
import type { Density } from "../../../shared/density.ts";
import { isMention } from "../entries/mention.ts";
import { feedShowAvatars } from "../../preferences/index.ts";
import { withoutReplyMention } from "../entries/message.ts";
import * as automod from "../automod.ts";
import { formatSuspicious } from "../entries/suspiciousText.ts";
import {
  Badges,
  type BadgePlacement,
  DisplayName,
  MessageText,
  type UserActions,
} from "../../message/index.ts";
import Timestamp from "../../../kit/Timestamp.tsx";
import FeedItem, { type ItemLayout } from "../item/index.ts";
import * as details from "./details.ts";
import Avatar from "./Avatar.tsx";
import Actions from "./Actions.tsx";
import Reply from "./Reply.tsx";
import Source from "./Source.tsx";

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
  onContextMenu?: (x: number, y: number, msg: FeedMessage) => void;
  onReply?: (msg: FeedMessage) => void;
  onReact?: (msg: FeedMessage, value: string) => void;
  onCopypasta?: (msg: FeedMessage) => void;
  onJumpToMessage?: (messageId: string) => void;
  onOpenChannel?: (broadcasterId: string) => void;
};

type Props = ItemLayout & MessageOptions & { item: FeedMessage };

export default function Message(props: Props) {
  const item = props.item;
  const hold = () => item.automod_hold;

  const comfortable = () =>
    props.density === "comfortable" && props.showName !== false;
  const density = (): Density => (comfortable() ? "comfortable" : "compact");

  function handleHold(action: AutomodAction) {
    const h = hold();
    if (h) void automod.resolve(h.broadcaster_user_id, item.message_id, action);
  }

  const mentioned = createMemo(() =>
    isMention(item, props.userLogin, props.keywords ?? []),
  );

  const badges = (placement: BadgePlacement) => (
    <Badges
      badges={props.showBadges !== false ? details.chatterBadges(item) : []}
      channelBadges={details.badgeMap(item, props.badges)}
      placement={placement}
    >
      <Show when={!comfortable() && item.source}>
        {(source) => <Source source={source()} onOpen={props.onOpenChannel} />}
      </Show>
    </Badges>
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
        <span class="italic text-ink-soft">
          {t("FEED_MESSAGE_DELETED_LABEL")}
        </span>
      }
    >
      <span
        class={`transition-colors duration-settle ${
          item.deleted ? "text-ink-faint *:text-ink-faint" : ""
        }`}
      >
        <MessageText
          fragments={withoutReplyMention(item)}
          emotes={props.emotes}
          cheermotes={props.cheermotes}
          mentionsYou={mentioned()}
          onShowUserCard={props.onShowUserCard}
          onUserContextMenu={props.onUserContextMenu}
        />
      </span>
      <Show when={item.deleted}>
        <span class="ml-1.5 text-feed-meta text-ink-faint select-none">
          {t("FEED_DELETED_MARK_LABEL")}
        </span>
      </Show>
    </Show>
  );

  const avatar = () => (
    <Avatar
      chatter={{
        id: item.chatter_user_id,
        login: item.chatter_login,
        displayName: item.chatter_name,
      }}
      color={item.color}
      source={item.source}
      onOpenSource={props.onOpenChannel}
      onShowUserCard={props.onShowUserCard}
      onUserContextMenu={props.onUserContextMenu}
    />
  );

  const toolbarActions = () => {
    const { onReply, onReact, onCopypasta, onContextMenu } = props;
    if (hold() || props.showToolbar === false) return null;
    if (!onReply || !onReact || !onCopypasta || !onContextMenu) return null;
    return { onReply, onReact, onCopypasta, onMore: onContextMenu };
  };

  const toolbar = (hovered: () => boolean) => (
    <Show when={hovered() && toolbarActions()}>
      {(actions) => (
        <Actions item={item} reactions={props.reactions} {...actions()} />
      )}
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
      toneColor={details.toneColor(
        item,
        props.highlightMentions !== false && mentioned(),
      )}
      dimmed={details.isHoldResolved(item)}
      tile={comfortable() && feedShowAvatars() ? avatar : undefined}
      overlay={toolbar}
      onContextMenu={
        props.onContextMenu && ((x, y) => props.onContextMenu?.(x, y, item))
      }
    >
      <FeedItem.Context
        thread={
          item.reply && (
            <Reply
              reply={item.reply}
              showAvatar={comfortable() && feedShowAvatars()}
              onJump={props.onJumpToMessage}
              onShowUserCard={props.onShowUserCard}
              onUserContextMenu={props.onUserContextMenu}
            />
          )
        }
      >
        <Show when={hold()}>
          {(h) => (
            <FeedItem.Note
              class="text-caution"
              label={
                h().mine
                  ? t("FEED_OWN_MESSAGE_HELD_LINE")
                  : t("FEED_AUTOMOD_HELD_LINE", { reason: h().reason })
              }
              suffix={
                details.isHoldResolved(item)
                  ? details.holdOutcome(h())
                  : undefined
              }
              actions={
                details.isHoldPending(item) && !h().mine
                  ? [
                      {
                        title: t("FEED_AUTOMOD_ALLOW_LABEL"),
                        icon: () => <Check class="size-4" />,
                        tone: "success",
                        onClick: () => handleHold("allow"),
                      },
                      {
                        title: t("FEED_AUTOMOD_DENY_LABEL"),
                        icon: () => <X class="size-4" />,
                        tone: "danger",
                        onClick: () => handleHold("deny"),
                      },
                    ]
                  : undefined
              }
            />
          )}
        </Show>
        <Show when={item.suspicious}>
          {(suspicious) => (
            <FeedItem.Note
              class="text-caution"
              label={formatSuspicious(suspicious())}
            />
          )}
        </Show>
        <Show when={item.cheer}>
          {(cheer) => (
            <FeedItem.Note
              class="text-event-support"
              label={t("FEED_CHEERED_LABEL", { bits: cheer().bits })}
            />
          )}
        </Show>
        <Show when={item.power_up}>
          {(perk) => (
            <FeedItem.Note
              class="text-event-support"
              label={t("FEED_MESSAGE_PERK_LABEL", { perk: perk() })}
            />
          )}
        </Show>
        <Show when={details.pointsLabel(item)}>
          {(label) => (
            <FeedItem.Note class="text-event-engagement" label={label()} />
          )}
        </Show>
        <Show when={item.first_message && !hold()}>
          <FeedItem.Note
            class="text-ink-soft"
            label={t("FEED_FIRST_MESSAGE_LABEL")}
          />
        </Show>
      </FeedItem.Context>
      <Show when={comfortable() && !props.continued}>
        <FeedItem.Title>
          {name()}
          {badges("after")}
          <Show when={props.showTimestamp}>
            <Timestamp ts={item.timestamp} format="c" variant="inline" />
          </Show>
        </FeedItem.Title>
      </Show>
      <FeedItem.Content>
        <Show when={!comfortable()}>
          {badges("before")}
          <Show when={props.showName !== false}>
            {name()}
            <span class="text-ink-soft">:</span>{" "}
          </Show>
        </Show>
        {body()}
      </FeedItem.Content>
    </FeedItem>
  );
}
