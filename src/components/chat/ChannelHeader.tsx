import { Clock, Gamepad2, Moon, Pencil, Users } from "lucide-solid";
import { createSignal, Show } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import { channelInfoFor, streamForUserId } from "../../lib/stores/channels.ts";
import * as clock from "../../lib/services/clock.ts";
import {
  formatUptime,
  formatViewers,
  streamGame,
  streamTitle,
} from "../../lib/format/stream.ts";
import { createCopyable } from "../ui/copyable.ts";
import type { User } from "../../lib/types/index.ts";
import Avatar from "../ui/Avatar.tsx";
import Stat from "../ui/Stat.tsx";
import { createChannelLink } from "../context-menus/createChannelLink.tsx";
import { canModerate, user } from "../../lib/stores/users.ts";
import InfoForm from "../channel-tools/InfoForm.tsx";
import IconButton from "../ui/IconButton.tsx";
import ActivityStrip from "../channel-tools/ActivityStrip.tsx";
import ConnectionBanner from "./ConnectionBanner.tsx";
import { chatConnected } from "../../lib/stores/eventsub.ts";
import Presence from "../ui/Presence.tsx";

type Props = {
  channel: User;
  onOpenChannel: (broadcasterId: string) => void;
};

export default function ChannelHeader(props: Props) {
  const stream = () => streamForUserId(props.channel.id);
  const info = () => channelInfoFor(props.channel.id);
  const title = () => streamTitle(stream(), info());
  const game = () => streamGame(stream(), info());
  const link = createChannelLink(() => props.channel);
  const name = createCopyable("text-ink");
  const titleCopy = createCopyable("text-ink-soft");

  const isBroadcaster = () => props.channel.id === user()?.id;
  const [editing, setEditing] = createSignal(false);
  const uptime = () => {
    const s = stream();
    return s ? formatUptime(s.startedAt, clock.now()) : "";
  };

  return (
    <header class="shrink-0 flex flex-col bg-surface border-b border-line-soft">
      <div class="flex items-center gap-4 px-4 py-3" {...link.handlers}>
        <Avatar
          src={props.channel.profileImageUrl}
          alt={props.channel.displayName}
          size={64}
          square
          presence={stream() ? "on-air" : "offline"}
        />
        <div class="flex-1 min-w-0 flex flex-col">
          <div class="flex items-center gap-4 min-w-0">
            <h1
              class={`shrink-0 max-w-1/2 text-heading truncate ${name.class()}`}
              {...name.handlers(() => props.channel.displayName)}
            >
              {props.channel.displayName}
            </h1>
            <div class="ml-auto min-w-0 flex items-center gap-5 text-body">
              <Stat icon={<Gamepad2 />} value={game()} copy={game()} truncate />
              <Show
                when={stream()}
                fallback={<Stat icon={<Moon />} value={t("CHAT_OFFLINE")} />}
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
          <Show when={title() || isBroadcaster()}>
            <div class="mt-1 flex items-center gap-2 min-w-0">
              <p
                class={`min-w-0 text-body truncate ${titleCopy.class()}`}
                data-tip={title()}
                {...titleCopy.handlers(title)}
              >
                {title()}
              </p>
              <Show when={isBroadcaster()}>
                <span class="ml-auto shrink-0 -my-1">
                  <IconButton
                    label={t("CHANNEL_TOOLS_EDIT_INFO")}
                    size="sm"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil class="size-4" />
                  </IconButton>
                </span>
              </Show>
            </div>
          </Show>
        </div>
      </div>
      <Presence when={!chatConnected()}>{() => <ConnectionBanner />}</Presence>
      <Show when={canModerate(props.channel.id)}>
        <ActivityStrip
          broadcasterId={props.channel.id}
          onOpenChannel={props.onOpenChannel}
        />
      </Show>
      {link.menu()}
      <Show when={editing()}>
        <InfoForm
          broadcasterId={props.channel.id}
          onDone={() => setEditing(false)}
        />
      </Show>
    </header>
  );
}
