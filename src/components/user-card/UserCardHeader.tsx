import type { Follow, User } from "../../lib/types/index.ts";
import { createEffect, createSignal } from "solid-js";
import { getUsers } from "../../lib/services/users.ts";
import {
  getChannelFollowers,
  getFollowedChannels,
} from "../../lib/api/twitch/channels.ts";
import {
  moderatedChannels,
  user as currentUser,
} from "../../lib/stores/users.ts";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Pin } from "lucide-solid";
import Avatar from "../ui/Avatar.tsx";
import IconButton from "../ui/IconButton.tsx";
import UserCardIdentity from "./UserCardIdentity.tsx";
import UserCardMeta from "./UserCardMeta.tsx";

type Follower = Follow;

type Props = {
  chatterId: string;
  broadcasterId: string;
  pinned: boolean;
  onTogglePin: () => void;
  onStartDrag: (e: MouseEvent) => void;
};

export default function UserCardHeader(props: Props) {
  const [user, setUser] = createSignal<User | null>(null);
  const [follower, setFollower] = createSignal<Follower | null>(null);

  const canQueryFollowers = () => {
    const me = currentUser();
    if (!me) return false;
    if (me.id === props.broadcasterId) return true;
    return moderatedChannels().some((c) => c.id === props.broadcasterId);
  };

  createEffect(() => {
    const id = props.chatterId;
    setUser(null);
    setFollower(null);
    getUsers({ ids: [id] })
      .then((users) => setUser(users[0] ?? null))
      .catch(() => {});
    const me = currentUser();
    if (me && id === me.id) {
      getFollowedChannels(
        { userId: id, broadcasterId: props.broadcasterId },
        { silent: true },
      )
        .then((rows) => {
          const row = rows[0];
          if (!row) return;
          setFollower({
            user: { id, login: me.login, displayName: me.displayName },
            followedAt: row.followedAt,
          });
        })
        .catch(() => {});
      return;
    }
    if (!canQueryFollowers()) return;
    getChannelFollowers(
      { broadcasterId: props.broadcasterId, userId: id, first: 1 },
      { silent: true },
    )
      .then((res) => setFollower(res.data[0] ?? null))
      .catch(() => {});
  });

  return (
    <div
      class="flex gap-4 p-4 border-b border-line-soft cursor-move select-none"
      onMouseDown={props.onStartDrag}
    >
      <button
        type="button"
        title="Open channel on Twitch"
        class="shrink-0 self-start flex rounded-sm cursor-pointer"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() =>
          user()?.login && openUrl(`https://twitch.tv/${user()!.login}`)}
      >
        <Avatar
          src={user()?.profileImageUrl}
          alt={user()?.displayName ?? ""}
          size={80}
          square
        />
      </button>
      <div class="flex-1 min-w-0 h-20 flex flex-col justify-center gap-2">
        <UserCardIdentity
          chatterId={props.chatterId}
          broadcasterId={props.broadcasterId}
          user={user()}
        />
        <UserCardMeta
          chatterId={props.chatterId}
          user={user()}
          follower={follower()}
        />
      </div>
      <IconButton
        label={props.pinned ? "Unpin card" : "Keep card open"}
        size="sm"
        pressed={props.pinned}
        class="self-start"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={props.onTogglePin}
      >
        <Pin class="size-4" fill={props.pinned ? "currentColor" : "none"} />
      </IconButton>
    </div>
  );
}
