import { Clock, Gamepad2, Moon, Users, Volume2, VolumeOff } from "lucide-solid";
import { Show } from "solid-js";
import { channelInfoFor, streamForUserId } from "../../lib/stores/channels.ts";
import { formatUptime, formatViewers } from "../../lib/format/stream.ts";
import type { ChannelInfo } from "../../lib/types/index.ts";
import type { Stream } from "../../lib/types/index.ts";
import type { User } from "../../lib/types/index.ts";
import Avatar from "../ui/Avatar.tsx";
import Stat from "../ui/Stat.tsx";
import RailRow from "./RailRow.tsx";

function StreamTooltip(props: {
  user: User;
  stream?: Stream;
  info?: ChannelInfo;
}) {
  const title = () => props.stream?.title ?? props.info?.title ?? "";
  const game = () => props.stream?.game.name ?? props.info?.game.name ?? "";

  return (
    <div class="flex flex-col gap-2 max-w-72 px-0.5 py-0.5">
      <p class="text-body font-semibold truncate">{props.user.displayName}</p>
      <Show when={title()}>
        <p class="text-body leading-relaxed text-ink wrap-break-word line-clamp-3">
          {title()}
        </p>
      </Show>
      <div class="pt-2 border-t border-line-soft flex flex-col gap-1">
        <Stat icon={<Gamepad2 />} value={game()} truncate />
        <Show
          when={props.stream}
          fallback={<Stat icon={<Moon />} value="Offline" />}
        >
          {(s) => (
            <>
              <Stat
                icon={<Users />}
                value={`${formatViewers(s().viewerCount)} viewers`}
              />
              <Stat icon={<Clock />} value={formatUptime(s().startedAt)} />
            </>
          )}
        </Show>
      </div>
    </div>
  );
}

type Props = {
  ch: User;
  selected: boolean;
  unread?: boolean;
  mentions?: number;
  dimmed?: boolean;
  muted?: boolean;
  ephemeral?: boolean;
  onToggleMute?: () => void;
  onSelect: () => void;
  onOpenInBrowser: () => void;
  onContextMenu: (x: number, y: number) => void;
};

export default function ChannelRow(props: Props) {
  const stream = () => streamForUserId(props.ch.id);
  const info = () => channelInfoFor(props.ch.id);
  const sub = () => {
    const s = stream();
    if (s) return `${s.game.name || "Live"} · ${formatViewers(s.viewerCount)}`;
    return info()?.game.name || "Offline";
  };

  return (
    <RailRow
      label={props.ch.displayName}
      sub={sub()}
      subTone={stream() ? "live" : "soft"}
      tooltip={
        <StreamTooltip user={props.ch} stream={stream()} info={info()} />
      }
      selected={props.selected}
      unread={props.unread}
      mentions={props.mentions}
      dimmed={props.dimmed}
      onClick={props.onSelect}
      onMiddleClick={props.onOpenInBrowser}
      onContextMenu={props.onContextMenu}
    >
      <Avatar
        src={props.ch.profileImageUrl}
        alt={props.ch.displayName}
        size={40}
        presence={stream() ? "live" : "offline"}
        dashed={props.ephemeral}
      >
        <Show when={props.onToggleMute}>
          <button
            type="button"
            title={props.muted ? "Unmute browser tab" : "Mute browser tab"}
            aria-label={props.muted ? "Unmute browser tab" : "Mute browser tab"}
            onClick={(e) => {
              e.stopPropagation();
              props.onToggleMute!();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            class={`absolute -top-0.5 -right-0.5 size-4 rounded-full ring-2 ring-surface grid place-items-center cursor-pointer transition-colors duration-snap ${
              props.muted
                ? "bg-negative text-on-accent"
                : "bg-raised text-ink hover:bg-overlay"
            }`}
          >
            <Show when={props.muted} fallback={<Volume2 class="size-2" />}>
              <VolumeOff class="size-2" />
            </Show>
          </button>
        </Show>
      </Avatar>
    </RailRow>
  );
}
