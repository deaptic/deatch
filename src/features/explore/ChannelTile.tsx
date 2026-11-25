import type { User } from "../../shared/types/index.ts";
import { createChannelLink } from "../menus/index.ts";
import Avatar from "../../kit/Avatar.tsx";
import { avatarZoom } from "../../shared/avatar.ts";
import CardButton from "../../kit/CardButton.tsx";
import Text from "../../kit/Text.tsx";

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
      variant="tile"
      {...link.handlers}
      data-tip={props.tip}
      cursor={link.cursor}
    >
      <Avatar
        src={props.channel.profileImageUrl}
        zoom={avatarZoom(props.channel.profileImageUrl)}
        alt={props.channel.displayName}
        size="lg"
        ring={props.live ? "negative" : undefined}
      />
      <span class="w-full min-w-0">
        <Text as="p" truncate size="sm" tone="primary">
          {props.channel.displayName}
        </Text>
        <span class="block truncate text-xs font-normal text-ink-faint">
          {props.detail}
        </span>
      </span>
      {link.menu()}
    </CardButton>
  );
}
