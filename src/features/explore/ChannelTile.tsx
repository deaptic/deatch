import type { User } from "../../shared/types/index.ts";
import { createChannelLink } from "../menus/index.ts";
import Avatar from "../../kit/Avatar.tsx";
import CardButton from "../../kit/CardButton.tsx";

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
    <CardButton
      look="tile"
      {...link.handlers}
      data-tip={props.tip}
      cursor={link.cursor}
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
    </CardButton>
  );
}
