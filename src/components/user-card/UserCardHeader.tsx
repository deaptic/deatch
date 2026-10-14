import type { FeedMessage, User } from "../../lib/types/index.ts";
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  on,
  Show,
} from "solid-js";
import * as users from "../../lib/services/users.ts";
import { getFollowedAt } from "../../lib/api/twitch/channels.ts";
import { getUserChatColor } from "../../lib/api/twitch/chat.ts";
import {
  isModOfChannel,
  knownUser,
  user as currentUser,
} from "../../lib/stores/users.ts";
import { openUrl } from "@tauri-apps/plugin-opener";
import { AtSign, Hash, Pin } from "lucide-solid";
import { feeds } from "../../lib/stores/feeds.ts";
import Avatar from "../ui/Avatar.tsx";
import BadgeBox from "../ui/BadgeBox.tsx";
import IconButton from "../ui/IconButton.tsx";
import CopyButton from "./CopyButton.tsx";
import UserCardIdentity from "./UserCardIdentity.tsx";
import UserCardMeta, { type FollowStatus } from "./UserCardMeta.tsx";

type Props = {
  chatterId: string;
  broadcasterId: string;
  messages: FeedMessage[];
  pinned: boolean;
  onTogglePin: () => void;
  onStartDrag: (e: MouseEvent) => void;
};

export default function UserCardHeader(props: Props) {
  const user = (): User | null => knownUser(props.chatterId) ?? null;
  const [follow, setFollow] = createSignal<FollowStatus>({ kind: "unknown" });

  const canSeeFollow = (chatterId: string) =>
    currentUser()?.id === chatterId || isModOfChannel(props.broadcasterId);

  createEffect(on(() => props.chatterId, (id) => {
    setFollow({ kind: "unknown" });
    users.fetch({ ids: [id] }, { silent: true }).catch(() => {});
    if (!canSeeFollow(id)) {
      setFollow({ kind: "hidden" });
      return;
    }
    getFollowedAt(
      { broadcasterId: props.broadcasterId, userId: id },
      { silent: true },
    )
      .then((at) => {
        if (props.chatterId !== id) return;
        setFollow(at ? { kind: "since", at } : { kind: "none" });
      })
      .catch(() => {});
  }));

  const [chatColor] = createResource(
    () => props.chatterId,
    (userId) =>
      getUserChatColor({ userId }, { silent: true }).catch((e) => {
        console.warn("[user-card] chat color not loaded", e);
        return null;
      }),
  );
  // A switched card keeps the last chatter's colour until the new one lands.
  const color = createMemo(() =>
    (!chatColor.loading && chatColor()) ||
    props.messages.find((m) => m.color)?.color
  );
  const openChannel = () => {
    const login = user()?.login;
    if (login) void openUrl(`https://twitch.tv/${login}`);
  };
  const channelBadges = () => feeds[props.broadcasterId]?.badges ?? {};
  const latestBadges = () => props.messages.at(-1)?.badges ?? [];

  return (
    <div
      class="relative shrink-0 border-b border-line-soft cursor-move select-none"
      onMouseDown={props.onStartDrag}
    >
      <div
        class="relative aspect-3/1 bg-(--banner)"
        style={{ "--banner": color() ?? "var(--color-raised)" }}
      >
        <Show when={user()?.offlineImageUrl}>
          {(src) => (
            <img
              src={src()}
              alt=""
              draggable={false}
              class="block size-full object-cover"
            />
          )}
        </Show>
      </div>
      <div class="absolute top-(--card-gap) right-(--card-gap) flex gap-(--card-gap) [&_button]:text-on-accent">
        <div class="flex rounded-sm bg-media-scrim">
          <Show when={user()}>
            {(u) => (
              <CopyButton copy={u().login} label="Copy login">
                <AtSign class="size-4" />
              </CopyButton>
            )}
          </Show>
          <CopyButton copy={props.chatterId} label="Copy user ID">
            <Hash class="size-4" />
          </CopyButton>
        </div>
        <div class="rounded-sm bg-media-scrim">
          <IconButton
            label={props.pinned ? "Unpin card" : "Keep card open"}
            size="sm"
            pressed={props.pinned}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={props.onTogglePin}
          >
            <Pin class="size-4" fill={props.pinned ? "currentColor" : "none"} />
          </IconButton>
        </div>
      </div>
      <div class="flex flex-col gap-(--card-gap) px-(--card-pad) pb-(--card-pad)">
        <div class="flex gap-(--card-gap)">
          <button
            type="button"
            title="Open channel on Twitch"
            class="relative shrink-0 self-start flex rounded-full cursor-pointer ring-6 ring-overlay -mt-(--avatar-lift)"
            onMouseDown={(e) => {
              e.stopPropagation();
              if (e.button === 1) e.preventDefault();
            }}
            onClick={openChannel}
            onAuxClick={(e) => e.button === 1 && openChannel()}
          >
            <Avatar
              src={user()?.profileImageUrl}
              alt={user()?.displayName ?? ""}
              size={80}
            />
          </button>
          <div class="ml-auto flex items-center pt-(--card-gap) text-(length:--card-name) [&>span]:mr-0">
            <BadgeBox
              badges={latestBadges()}
              channelBadges={channelBadges()}
            />
          </div>
        </div>
        <UserCardIdentity
          chatterId={props.chatterId}
          user={user()}
          color={color()}
        />
        <UserCardMeta user={user()} follow={follow()} />
      </div>
    </div>
  );
}
