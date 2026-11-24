import type { User } from "../../shared/types/index.ts";
import { createChannelLink } from "../menus/index.ts";
import Avatar from "../../kit/Avatar.tsx";

type Props = {
  channel: User;
  live: boolean;
  detail: string;
  tip?: string;
  onSelect: (channel: User) => void;
};

export default function ChannelTile(props: Props) {
  const link = createChannelLink(
    () => props.channel,
    () => props.onSelect(props.channel),
  );

  return (
    <button
      type="button"
      {...link.handlers}
      data-tip={props.tip}
      class={`group flex flex-col items-center gap-2 min-w-0 rounded-md p-2 text-center pressable hover:bg-surface active:pressed ${link.cursor}`}
    >
      <Avatar
        src={props.channel.profileImageUrl}
        alt={props.channel.displayName}
        size={64}
        liveRing={props.live}
      />
      <span class="w-full min-w-0">
        <span class="block truncate text-small text-ink">
          {props.channel.displayName}
        </span>
        <span class="block truncate text-micro font-normal text-ink-faint">
          {props.detail}
        </span>
      </span>
      {link.menu()}
    </button>
  );
}
