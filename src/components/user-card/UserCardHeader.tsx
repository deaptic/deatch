import type { User } from "../../lib/types/index.ts";
import { createEffect, createSignal, on } from "solid-js";
import * as users from "../../lib/services/users.ts";
import { getFollowedAt } from "../../lib/api/twitch/channels.ts";
import {
  knownUser,
  moderatedChannels,
  user as currentUser,
} from "../../lib/stores/users.ts";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Pin } from "lucide-solid";
import Avatar from "../ui/Avatar.tsx";
import IconButton from "../ui/IconButton.tsx";
import UserCardIdentity from "./UserCardIdentity.tsx";
import UserCardMeta from "./UserCardMeta.tsx";

type Props = {
  chatterId: string;
  broadcasterId: string;
  pinned: boolean;
  onTogglePin: () => void;
  onStartDrag: (e: MouseEvent) => void;
};

export default function UserCardHeader(props: Props) {
  const user = (): User | null => knownUser(props.chatterId) ?? null;
  const [followedAt, setFollowedAt] = createSignal<string | null>(null);

  const canSeeFollow = (chatterId: string) => {
    const me = currentUser();
    if (!me) return false;
    if (me.id === chatterId || me.id === props.broadcasterId) return true;
    return moderatedChannels().some((c) => c.id === props.broadcasterId);
  };

  createEffect(on(() => props.chatterId, (id) => {
    setFollowedAt(null);
    users.fetch({ ids: [id] }, { silent: true }).catch(() => {});
    if (!canSeeFollow(id)) return;
    getFollowedAt(
      { broadcasterId: props.broadcasterId, userId: id },
      { silent: true },
    )
      .then(setFollowedAt)
      .catch(() => {});
  }));

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
          followedAt={followedAt()}
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
