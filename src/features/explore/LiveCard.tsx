import { For, Show } from "solid-js";
import { Clock, Users } from "lucide-solid";
import type { Stream, User } from "../../shared/types/index.ts";
import { LivePill, resolveUser } from "../channels/index.ts";
import { formatUptime, formatCount } from "../../shared/format/stream.ts";
import * as clock from "../../shared/clock.ts";
import { createChannelLink } from "../menus/index.ts";
import Thumbnail from "../../kit/Thumbnail.tsx";
import Avatar from "../../kit/Avatar.tsx";
import { avatarZoom } from "../../shared/avatar.ts";
import Chip from "../../kit/Chip.tsx";
import Stat from "../../kit/Stat.tsx";
import CardButton from "../../kit/CardButton.tsx";
import Text from "../../kit/Text.tsx";

const SHOWN_TAGS = 3;

type Props = {
  stream: Stream;
  thumbnailVersion: number;
  onSelect: (channel: User) => void;
};

export default function LiveCard(props: Props) {
  const channel = () => resolveUser(props.stream.user);
  const thumbnail = () =>
    `${props.stream.thumbnailUrl}?v=${props.thumbnailVersion}`;

  const link = createChannelLink(channel, () => props.onSelect(channel()));

  return (
    <CardButton look="card" {...link.handlers} cursor={link.cursor}>
      <Thumbnail src={thumbnail()} shape="video" fit="bleed">
        <span class="absolute left-2.5 top-2.5">
          <LivePill solid />
        </span>
        <div class="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between gap-1.5 text-sm">
          <Stat
            tone="media"
            icon={<Users />}
            value={formatCount(props.stream.viewerCount)}
          />
          <Stat
            tone="media"
            icon={<Clock />}
            value={formatUptime(props.stream.startedAt, clock.now())}
          />
        </div>
      </Thumbnail>

      <div class="flex gap-3 px-3.5 pt-3 pb-3.5 items-start">
        <Avatar
          src={channel().profileImageUrl}
          zoom={avatarZoom(channel().profileImageUrl)}
          alt={channel().displayName}
          size={40}
        />
        <div class="min-w-0 flex-1">
          <Text as="p" truncate size="md" bold tone="primary">
            {props.stream.title}
          </Text>
          <Text as="p" truncate size="sm" tone="soft">
            {channel().displayName}
            <Show when={props.stream.game.name}>
              {(game) => <Text tone="faint"> · {game()}</Text>}
            </Show>
          </Text>
          <Show when={props.stream.tags.length}>
            <div class="mt-2 flex flex-wrap gap-1 h-5 overflow-hidden">
              <For each={props.stream.tags.slice(0, SHOWN_TAGS)}>
                {(tag) => <Chip variant="label" label={tag} />}
              </For>
            </div>
          </Show>
        </div>
      </div>
      {link.menu()}
    </CardButton>
  );
}
