import { createSignal, createEffect } from "solid-js";
import { getUsers, type User } from "../../lib/api/twitch/users";
import {
  getChannelFollowers,
  getFollowedChannels,
  type Follow,
} from "../../lib/api/twitch/channels";
import { user as currentUser, moderatedChannels } from "../../lib/stores/users";
import { copyField } from "../../lib/utils/clipboard";
import UserCardIdentity from "./UserCardIdentity";
import UserCardMeta from "./UserCardMeta";

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
      class="flex gap-3 p-3 border-b border-border-muted cursor-move select-none"
      onMouseDown={props.onStartDrag}
    >
      <img
        src={user()?.profileImageUrl || ""}
        alt={user()?.displayName ?? ""}
        title="Click to copy image URL"
        class="w-20 h-20 shrink-0 self-start rounded-lg bg-bg-light cursor-pointer object-cover"
        onClick={() =>
          user()?.profileImageUrl && copyField(user()!.profileImageUrl)
        }
      />
      <div class="flex-1 min-w-0 flex flex-col gap-1">
        <UserCardIdentity
          chatterId={props.chatterId}
          broadcasterId={props.broadcasterId}
          user={user()}
          pinned={props.pinned}
          onTogglePin={props.onTogglePin}
        />
        <UserCardMeta
          chatterId={props.chatterId}
          user={user()}
          follower={follower()}
        />
      </div>
    </div>
  );
}
