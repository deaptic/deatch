import type { FeedMessage } from "../feed/index.ts";
import type { FollowStatus } from "../users/index.ts";
import type { User } from "../../shared/types/index.ts";
import { createEffect, createMemo, createResource, on, Show } from "solid-js";
import { users } from "../users/index.ts";
import { knownUser } from "../users/index.ts";
import { hasPermission } from "../permissions/index.ts";
import { getSubscription } from "../../platform/twitch/subscriptions.ts";
import * as browser from "../../platform/browser.ts";
import { Pin, X } from "lucide-solid";
import { feeds } from "../feed/index.ts";
import { onMiddleClick, preventAutoscroll } from "../../kit/middleClick.ts";
import Avatar from "../../kit/Avatar.tsx";
import { avatarZoom } from "../../shared/avatar.ts";
import { Badges } from "../message/index.ts";
import IconButton from "../../kit/IconButton.tsx";
import Identity from "./Identity.tsx";
import Live from "./ui/Live.tsx";
import { streamForUserId } from "../channels/index.ts";
import Meta from "./ui/Meta.tsx";
import { t } from "../../shared/i18n/index.ts";
import { openMenuAt } from "../../kit/contextMenu.ts";

type Props = {
  chatterId: string;
  broadcasterId: string;
  messages: FeedMessage[];
  pinned: boolean;
  onTogglePin: () => void;
  onClose: () => void;
  onStartDrag: (e: MouseEvent) => void;
  onContextMenu: (x: number, y: number) => void;
  onOpenChannel: (broadcasterId: string) => void;
};

export default function Header(props: Props) {
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

  const [subscription] = createResource(
    () =>
      hasPermission(props.broadcasterId, "viewSubscriptions") && {
        broadcasterId: props.broadcasterId,
        userId: props.chatterId,
      },
    (params) => getSubscription(params, { silent: true }).catch(() => null),
  );

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
        <Meta user={user()} follow={follow()} />
      </div>
      <div class="absolute top-card-gap right-card-gap flex rounded-sm bg-media-scrim">
        <IconButton
          label={t(
            props.pinned ? "USER_CARD_UNPIN_LABEL" : "USER_CARD_PIN_LABEL",
          )}
          variant="media"
          size="sm"
          pressed={props.pinned}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={props.onTogglePin}
        >
          <Pin class="size-4" fill={props.pinned ? "currentColor" : "none"} />
        </IconButton>
        <IconButton
          label={t("USER_CARD_CLOSE_LABEL")}
          variant="media"
          size="sm"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={props.onClose}
        >
          <X class="size-4" />
        </IconButton>
      </div>
      <div class="flex flex-col gap-card-gap px-card-pad pb-card-pad contain-inline-size">
        <div class="flex gap-card-gap">
          <button
            type="button"
            aria-label={t("USER_CARD_OPEN_CHAT_LABEL")}
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
              zoom={avatarZoom(user()?.profileImageUrl)}
              alt={user()?.displayName ?? ""}
              size={80}
            />
          </button>
          <div class="ml-auto flex items-center pt-card-gap text-2xl">
            <Badges
              badges={latestBadges()}
              channelBadges={channelBadges()}
              placement="alone"
            />
          </div>
        </div>
        <Identity
          chatterId={props.chatterId}
          user={user()}
          color={color()}
          subscription={subscription() ?? null}
        />
        <Live
          stream={stream()}
          onOpen={() => props.onOpenChannel(props.chatterId)}
        />
        <Show when={user()?.description}>
          {(bio) => (
            <p
              class="text-sm text-ink-soft line-clamp-3 wrap-break-word"
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
