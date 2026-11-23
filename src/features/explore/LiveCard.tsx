import { For, Show } from "solid-js";
import { Clock, Users } from "lucide-solid";
import type { Stream, User } from "../../lib/types/index.ts";
import { resolveUser } from "../channels/index.ts";
import { formatUptime, formatViewers } from "../../shared/format/stream.ts";
import * as clock from "../../lib/services/clock.ts";
import { createChannelLink } from "../menus/index.ts";
import Thumbnail from "../../kit/Thumbnail.tsx";
import Avatar from "../../kit/Avatar.tsx";
import Chip from "../../kit/Chip.tsx";
import LivePill from "../../kit/LivePill.tsx";
import Stat from "../../kit/Stat.tsx";
import { CARD_FRAME } from "../../kit/Card.tsx";

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
    <button
      type="button"
      {...link.handlers}
      class={`group flex flex-col text-left bg-surface overflow-hidden pressable hover:bg-raised active:pressed ${CARD_FRAME} ${link.cursor}`}
    >
      <Thumbnail src={thumbnail()} shape="video" fit="bleed">
        <span class="absolute left-2.5 top-2.5">
          <LivePill solid />
        </span>
        <div class="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between gap-1.5 text-small">
          <Stat
            tone="media"
            icon={<Users />}
            value={formatViewers(props.stream.viewerCount)}
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
          alt={channel().displayName}
          size={40}
        />
        <div class="min-w-0 flex-1">
          <p class="truncate text-body font-semibold text-ink">
            {props.stream.title}
          </p>
          <p class="truncate text-small text-ink-soft">
            {channel().displayName}
            <Show when={props.stream.game.name}>
              {(game) => <span class="text-ink-faint"> · {game()}</span>}
            </Show>
          </p>
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
    </button>
  );
}
