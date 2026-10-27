import { Check, X } from "lucide-solid";
import { createMemo, Show } from "solid-js";
import { t } from "../../../lib/i18n/index.ts";
import type { EmoteMap } from "../../../lib/stores/emotes.ts";
import type { CheermoteMap } from "../../../lib/utils/cheermote.ts";
import type {
  AutomodHoldInfo,
  BadgeMap,
  FeedMessage,
} from "../../../lib/types/index.ts";
import type { Density } from "../../../lib/constants/density.ts";
import { isMention } from "../../../lib/utils/mention.ts";
import { withoutReplyMention } from "../../../lib/utils/message.ts";
import * as automod from "../../../lib/services/automod.ts";
import { formatSuspicious } from "../../../lib/format/suspicious.ts";
import { sourceBadges } from "../../../lib/stores/sourceBadges.ts";
import BadgeBox, { type BadgePlacement } from "../../ui/BadgeBox.tsx";
import DisplayName from "../../ui/DisplayName.tsx";
import type { UserActions } from "../../ui/userLink.ts";
import Timestamp from "../../ui/Timestamp.tsx";
import type {
  Annotation,
  ItemLayout,
  ItemParts,
  RowTone,
} from "../itemParts.ts";
import ChatterAvatar from "./ChatterAvatar.tsx";
import Fragments from "../../ui/Fragments.tsx";
import MessageToolbar from "./MessageToolbar.tsx";
import ReplyLine from "./ReplyLine.tsx";
import RichNotice from "./RichNotice.tsx";
import SourceChannel from "./SourceChannel.tsx";
import type { Reaction } from "../../../lib/types/index.ts";

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

function holdOutcome(hold: AutomodHoldInfo): string {
  return hold.moderator
    ? t("FEED_AUTOMOD_STATUS_BY", { status: hold.status, mod: hold.moderator })
    : t("FEED_AUTOMOD_STATUS", { status: hold.status });
}

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

  const comfortable = () =>
    props.density === "comfortable" && props.showName !== false;

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

  const visibleFragments = () => withoutReplyMention(item);

  const holdNotice = () => (
    <RichNotice
      class="text-caution"
      label={t("FEED_AUTOMOD_HELD", { reason: hold()!.reason })}
      suffix={holdResolved() ? holdOutcome(hold()!) : undefined}
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
  );

  const annotations = createMemo((): Annotation[] => {
    const list: Annotation[] = [];
    if (hold()) list.push({ content: holdNotice() });
    if (item.suspicious) {
      list.push({
        content: (
          <RichNotice
            class="text-caution"
            label={formatSuspicious(item.suspicious)}
          />
        ),
      });
    }
    if (item.cheer) {
      list.push({
        content: (
          <RichNotice
            class="text-event-bits"
            label={t("FEED_CHEERED", { bits: item.cheer.bits })}
          />
        ),
      });
    }
    if (item.power_up) {
      list.push({
        content: (
          <RichNotice
            class="text-event-bits"
            label={t("FEED_MESSAGE_PERK", { perk: item.power_up })}
          />
        ),
      });
    }
    const points = item.channel_points;
    if (points && points.kind !== "custom_reward") {
      list.push({
        content: (
          <RichNotice
            class="text-event-channel-points"
            label={t("FEED_MESSAGE_PERK", { perk: points.kind })}
          />
        ),
      });
    }
    if (points?.kind === "custom_reward") {
      const redemption = points.redemption;
      list.push({
        content: (
          <RichNotice
            class="text-event-channel-points"
            label={redemption
              ? t("FEED_REDEEMED_REWARD", {
                reward: redemption.reward.title,
                cost: redemption.reward.cost,
              })
              : t("FEED_REDEEMED_CHANNEL_POINTS")}
          />
        ),
      });
    }
    if (item.first_message && !hold()) {
      list.push({
        content: (
          <RichNotice class="text-ink-soft" label={t("FEED_FIRST_MESSAGE")} />
        ),
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
            onShowUserCard={props.onShowUserCard}
            onUserContextMenu={props.onUserContextMenu}
          />
        ),
      });
    }
    return list;
  });

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
      <span class={item.deleted ? "*:text-ink-faint" : ""}>
        <Fragments
          fragments={visibleFragments()}
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
    <ChatterAvatar
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
      return holdResolved();
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
