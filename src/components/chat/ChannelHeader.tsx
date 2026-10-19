import { Clock, Gamepad2, Moon, Users } from "lucide-solid";
import { Show } from "solid-js";
import { channelInfoFor, streamForUserId } from "../../lib/stores/channels.ts";
import * as clock from "../../lib/services/clock.ts";
import { formatUptime, formatViewers } from "../../lib/format/stream.ts";
import { createCopyable } from "../ui/copyable.ts";
import type { User } from "../../lib/types/index.ts";
import Avatar from "../ui/Avatar.tsx";
import Stat from "../ui/Stat.tsx";
import { createChannelLink } from "../context-menus/createChannelLink.tsx";

type Props = {
  channel: User;
};

export default function ChannelHeader(props: Props) {
  const stream = () => streamForUserId(props.channel.id);
  const info = () => channelInfoFor(props.channel.id);
  const title = () => stream()?.title ?? info()?.title ?? "";
  const game = () => stream()?.game.name ?? info()?.game.name ?? "";
  const link = createChannelLink(() => props.channel);
  const name = createCopyable("text-ink");
  const titleCopy = createCopyable("text-ink-soft");

  const uptime = () => {
    const s = stream();
    return s ? formatUptime(s.startedAt, clock.now()) : "";
  };

  return (
    <header
      class="h-28 shrink-0 flex items-center gap-4 pl-4 pr-6 border-b border-line-soft"
      {...link.handlers}
    >
      <Avatar
        src={props.channel.profileImageUrl}
        alt={props.channel.displayName}
        size={80}
        square
        presence={stream() ? "live" : "offline"}
      />
      <div class="flex-1 min-w-0 flex flex-col justify-center gap-2">
        <h1
          class={`text-title truncate ${name.class()}`}
          title={name.title()}
          onClick={() => name.copy(props.channel.displayName)}
        >
          {props.channel.displayName}
        </h1>
        <Show when={title()}>
          {(t) => (
            <p
              class={`text-body truncate ${titleCopy.class()}`}
              title={titleCopy.title(t())}
              onClick={() => titleCopy.copy(t())}
            >
              {t()}
            </p>
          )}
        </Show>
        <div class="flex items-center gap-5 min-w-0 text-small">
          <Stat icon={<Gamepad2 />} value={game()} copy={game()} truncate />
          <Show
            when={stream()}
            fallback={<Stat icon={<Moon />} value="Offline" />}
          >
            {(s) => (
              <>
                <Stat
                  icon={<Users />}
                  value={formatViewers(s().viewerCount)}
                  copy={String(s().viewerCount)}
                />
                <Stat icon={<Clock />} value={uptime()} copy={uptime()} />
              </>
            )}
          </Show>
        </div>
      </div>
      {link.menu()}
    </header>
  );
}
