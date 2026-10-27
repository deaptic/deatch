import { Check, X } from "lucide-solid";
import { createMemo, Show } from "solid-js";
import { t } from "../../../lib/i18n/index.ts";
import type { EmoteMap } from "../../../lib/stores/emotes.ts";
import type { CheermoteMap } from "../../../lib/utils/cheermote.ts";
import type {
  BadgeMap,
  FeedMessage,
  Reaction,
} from "../../../lib/types/index.ts";
import type { Density } from "../../../lib/constants/density.ts";
import { isMention } from "../../../lib/utils/mention.ts";
import { withoutReplyMention } from "../../../lib/utils/message.ts";
import * as automod from "../../../lib/services/automod.ts";
import { formatSuspicious } from "../../../lib/format/suspicious.ts";
import BadgeBox, { type BadgePlacement } from "../../ui/BadgeBox.tsx";
import DisplayName from "../../ui/DisplayName.tsx";
import Fragments from "../../ui/Fragments.tsx";
import Timestamp from "../../ui/Timestamp.tsx";
import type { UserActions } from "../../ui/userLink.ts";
import FeedItem, { type ItemLayout } from "../item/index.ts";
import * as message from "./message.ts";
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
  onOpenChannel?: (channelId: string) => void;
};

type Props = ItemLayout & MessageOptions & { item: FeedMessage };

export default function Message(props: Props) {
  const item = props.item;
  const hold = () => item.automod_hold;

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

  // Spacious rows pin the source channel to the avatar instead.
  const badges = (placement: BadgePlacement) => (
    <BadgeBox
      badges={props.showBadges !== false ? message.chatterBadges(item) : []}
      channelBadges={message.badgeMap(item, props.badges)}
      placement={placement}
    >
      <Show when={!comfortable() && item.source}>
        {(source) => <Source source={source()} onOpen={props.onOpenChannel} />}
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
        <span class="ml-1.5 text-feed-meta text-ink-faint select-none">
          (deleted)
        </span>
      </Show>
    </Show>
  );

  const avatar = (active: () => boolean) => (
    <Avatar
      chatter={{
        id: item.chatter_user_id,
        login: item.chatter_login,
        displayName: item.chatter_name,
      }}
      color={item.color}
      active={active()}
      source={item.source}
      onOpenSource={props.onOpenChannel}
      onShowUserCard={props.onShowUserCard}
      onUserContextMenu={props.onUserContextMenu}
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
      <Actions
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
      tone={message.tone(
        item,
        props.highlightMentions !== false && mentioned(),
      )}
      dimmed={message.isHoldResolved(item)}
      tile={comfortable() ? avatar : undefined}
      overlay={toolbar}
      onContextMenu={props.onContextMenu &&
        ((x, y) => props.onContextMenu!(x, y, item))}
    >
      <FeedItem.Context
        thread={item.reply && (
          <Reply
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
            <FeedItem.Note
              class="text-caution"
              label={t("FEED_AUTOMOD_HELD", { reason: h().reason })}
              suffix={message.isHoldResolved(item)
                ? message.holdOutcome(h())
                : undefined}
              actions={message.isHoldPending(item)
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
            <FeedItem.Note
              class="text-caution"
              label={formatSuspicious(suspicious())}
            />
          )}
        </Show>
        <Show when={item.cheer}>
          {(cheer) => (
            <FeedItem.Note
              class="text-event-bits"
              label={t("FEED_CHEERED", { bits: cheer().bits })}
            />
          )}
        </Show>
        <Show when={item.power_up}>
          {(perk) => (
            <FeedItem.Note
              class="text-event-bits"
              label={t("FEED_MESSAGE_PERK", { perk: perk() })}
            />
          )}
        </Show>
        <Show when={message.pointsLabel(item)}>
          {(label) => (
            <FeedItem.Note class="text-event-channel-points" label={label()} />
          )}
        </Show>
        <Show when={item.first_message && !hold()}>
          <FeedItem.Note
            class="text-ink-soft"
            label={t("FEED_FIRST_MESSAGE")}
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
            <span class="text-ink-soft">:</span>
            {" "}
          </Show>
        </Show>
        {body()}
      </FeedItem.Content>
    </FeedItem>
  );
}
