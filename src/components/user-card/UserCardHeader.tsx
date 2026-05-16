import { createSignal, createEffect } from "solid-js";
import { getUsers, type User } from "../../commands/users";
import {
  getChannelFollowers,
  type GetChannelFollowersResponse,
} from "../../commands/channels";
import { user as currentUser, moderatedChannels } from "../../state/users";
import { copyField } from "../../utils/clipboard";
import UserCardIdentity from "./UserCardIdentity";
import UserCardMeta from "./UserCardMeta";

type Follower = GetChannelFollowersResponse["data"][number];

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
    return moderatedChannels().some(
      (c) => c.broadcaster_id === props.broadcasterId,
    );
  };

  createEffect(() => {
    const id = props.chatterId;
    setUser(null);
    setFollower(null);
    getUsers({ userIds: [id] })
      .then((users) => setUser(users[0] ?? null))
      .catch(() => {});
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
        src={user()?.profile_image_url || ""}
        alt={user()?.display_name ?? ""}
        title="Click to copy image URL"
        class="w-20 h-20 shrink-0 self-start rounded-lg bg-bg-light cursor-pointer object-cover"
        onClick={() =>
          user()?.profile_image_url && copyField(user()!.profile_image_url!)
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
