import type { FeedMessage, FollowStatus, User } from "../../lib/types/index.ts";
import { createEffect, createMemo, createResource, on, Show } from "solid-js";
import * as users from "../../lib/services/users.ts";
import { knownUser } from "../../lib/stores/users.ts";
import * as browser from "../../lib/services/browser.ts";
import { Pin } from "lucide-solid";
import { feeds } from "../../lib/stores/feeds.ts";
import {
  onMiddleClick,
  preventAutoscroll,
} from "../../lib/utils/middleClick.ts";
import Avatar from "../ui/Avatar.tsx";
import BadgeBox from "../ui/BadgeBox.tsx";
import IconButton from "../ui/IconButton.tsx";
import UserCardIdentity from "./UserCardIdentity.tsx";
import UserCardLive from "./UserCardLive.tsx";
import { streamForUserId } from "../../lib/stores/channels.ts";
import UserCardMeta from "./UserCardMeta.tsx";
import { t } from "../../lib/i18n/index.ts";
import { openMenuAt } from "../../lib/utils/contextMenu.ts";

type Props = {
  chatterId: string;
  broadcasterId: string;
  messages: FeedMessage[];
  pinned: boolean;
  onTogglePin: () => void;
  onStartDrag: (e: MouseEvent) => void;
  onContextMenu: (x: number, y: number) => void;
  onOpenChannel: (broadcasterId: string) => void;
};

export default function UserCardHeader(props: Props) {
  const user = (): User | null => knownUser(props.chatterId) ?? null;
  createEffect(
    on(
      () => props.chatterId,
      (id) => users.fetchFresh({ ids: [id] }, { silent: true }).catch(() => {}),
    ),
  );

  const [followed] = createResource(
    () => ({ broadcasterId: props.broadcasterId, chatterId: props.chatterId }),
    ({ broadcasterId, chatterId }) =>
      users.followStatus(broadcasterId, chatterId),
  );
  const follow = (): FollowStatus =>
    (!followed.loading && followed()) || { kind: "unknown" };

  const [chatColor] = createResource(() => props.chatterId, users.chatColor);
  const color = createMemo(
    () =>
      (!chatColor.loading && chatColor()) ||
      props.messages.find((m) => m.color)?.color,
  );
  const openInBrowser = () => {
    const login = user()?.login;
    if (login) browser.openChannel(login);
  };
  const stream = () => streamForUserId(props.chatterId);
  const bannerImage = () =>
    stream()?.thumbnailUrl ?? user()?.offlineImageUrl ?? undefined;
  const channelBadges = () => feeds[props.broadcasterId]?.badges ?? {};
  const latestBadges = () => props.messages.at(-1)?.badges ?? [];

  return (
    <div class="relative shrink-0 min-w-card-width">
      <div
        class="relative aspect-3/1 flex items-end justify-end pl-card-avatar-clear pr-card-gap pb-card-gap cursor-move select-none bg-(--banner)"
        style={{ "--banner": color() ?? "var(--color-raised)" }}
        onMouseDown={props.onStartDrag}
        onContextMenu={(e) => openMenuAt(e, props.onContextMenu)}
      >
        <Show when={bannerImage()}>
          {(src) => (
            <img
              src={src()}
              alt=""
              draggable={false}
              class="absolute inset-0 size-full object-cover"
            />
          )}
        </Show>
        <UserCardMeta user={user()} follow={follow()} />
      </div>
      <div class="absolute top-card-gap right-card-gap flex rounded-sm bg-media-scrim">
        <IconButton
          label={t(props.pinned ? "USER_CARD_UNPIN" : "USER_CARD_PIN")}
          variant="media"
          size="sm"
          pressed={props.pinned}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={props.onTogglePin}
        >
          <Pin class="size-4" fill={props.pinned ? "currentColor" : "none"} />
        </IconButton>
      </div>
      <div class="flex flex-col gap-card-gap px-card-pad pb-card-pad contain-inline-size">
        <div class="flex gap-card-gap">
          <button
            type="button"
            aria-label={t("USER_CARD_OPEN_CHAT")}
            class="relative shrink-0 self-start flex rounded-full cursor-pointer ring-6 ring-overlay -mt-card-avatar-lift"
            onMouseDown={(e) => {
              e.stopPropagation();
              preventAutoscroll(e);
            }}
            onClick={() => props.onOpenChannel(props.chatterId)}
            onAuxClick={onMiddleClick(openInBrowser)}
          >
            <Avatar
              src={user()?.profileImageUrl}
              alt={user()?.displayName ?? ""}
              size={80}
            />
          </button>
          <div class="ml-auto flex items-center pt-card-gap text-card-name">
            <BadgeBox
              badges={latestBadges()}
              channelBadges={channelBadges()}
              placement="alone"
            />
          </div>
        </div>
        <UserCardIdentity
          chatterId={props.chatterId}
          user={user()}
          color={color()}
        />
        <UserCardLive
          stream={stream()}
          onOpen={() => props.onOpenChannel(props.chatterId)}
        />
        <Show when={user()?.description}>
          {(bio) => (
            <p
              class="text-small text-ink-soft line-clamp-3 wrap-break-word"
              data-tip={bio()}
            >
              {bio()}
            </p>
          )}
        </Show>
      </div>
    </div>
  );
}
