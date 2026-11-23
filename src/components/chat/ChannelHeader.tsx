import {
  Clock,
  Gamepad2,
  Info,
  Moon,
  Pencil,
  Users,
  UsersRound,
} from "lucide-solid";
import { type JSX, Show } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import { channelInfoFor, streamForUserId } from "../../lib/stores/channels.ts";
import * as clock from "../../lib/services/clock.ts";
import {
  formatUptime,
  formatViewers,
  streamDetails,
  streamGame,
  streamTitle,
} from "../../lib/format/stream.ts";
import { createCopyable } from "../ui/copyable.ts";
import type { User } from "../../lib/types/index.ts";
import Avatar from "../ui/Avatar.tsx";
import Stat from "../ui/Stat.tsx";
import { createChannelLink } from "../context-menus/createChannelLink.tsx";
import { canModerate, user } from "../../lib/stores/users.ts";
import { ChannelToolForm } from "../channel-tools/ChannelToolsMenu.tsx";
import { channelForm, setChannelForm } from "../../lib/stores/ui.ts";
import IconButton from "../ui/IconButton.tsx";
import ActivityStrip from "../channel-tools/ActivityStrip.tsx";
import ConnectionBanner from "./ConnectionBanner.tsx";
import { chatConnected } from "../../lib/stores/eventsub.ts";
import ActivityMenuButton from "../channel-tools/ActivityMenuButton.tsx";
import { isOverlayOpen, toggleOverlay } from "../../lib/stores/ui.ts";
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
  const avatar = (overlay?: JSX.Element) => (
    <Avatar
      src={props.channel.profileImageUrl}
      alt={props.channel.displayName}
      size={64}
      square
      presence={stream() ? "on-air" : "offline"}
      overlay={overlay}
    />
  );
  const uptime = () => {
    const s = stream();
    return s ? formatUptime(s.startedAt, clock.now()) : "";
  };

  return (
    <header class="shrink-0 flex flex-col bg-surface border-b border-line-soft">
      <div class="flex items-center gap-4 px-4 py-3" {...link.handlers}>
        <Show when={isBroadcaster()} fallback={avatar()}>
          <button
            type="button"
            aria-label={t("HEADER_EDIT_INFO_LABEL")}
            data-tip={t("HEADER_EDIT_INFO_LABEL")}
            class="group shrink-0 rounded-xs cursor-pointer pressable active:pressed"
            onClick={() => setChannelForm("info")}
          >
            {avatar(
              <span class="absolute inset-0 grid place-items-center rounded-xs bg-media-scrim text-on-accent opacity-0 transition-opacity duration-quick group-hover:opacity-100 group-focus-visible:opacity-100 [&>svg]:size-6">
                <Pencil />
              </span>,
            )}
          </button>
        </Show>
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
                fallback={
                  <Stat icon={<Moon />} value={t("HEADER_OFFLINE_STATUS")} />
                }
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
          <Show when={title() || stream() || canModerate(props.channel.id)}>
            <div class="mt-1 flex items-center gap-2 min-w-0">
              <p
                class={`min-w-0 text-body truncate ${titleCopy.class()}`}
                data-tip={title()}
                {...titleCopy.handlers(title)}
              >
                {title()}
              </p>
              <span class="ml-auto shrink-0 -my-1 flex items-center gap-1">
                <Show when={stream()}>
                  {(s) => (
                    <IconButton
                      label={t("HEADER_STREAM_DETAILS_LABEL")}
                      tip={streamDetails(s())}
                      size="sm"
                    >
                      <Info class="size-4" />
                    </IconButton>
                  )}
                </Show>
                <Show when={canModerate(props.channel.id)}>
                  <ActivityMenuButton broadcasterId={props.channel.id} />
                  <IconButton
                    label={t("HEADER_CHATTERS_LABEL")}
                    size="sm"
                    pressed={isOverlayOpen("chatters")}
                    onClick={() => toggleOverlay("chatters")}
                  >
                    <UsersRound class="size-4" />
                  </IconButton>
                </Show>
              </span>
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
      <Show when={channelForm()}>
        {(form) => (
          <ChannelToolForm
            form={form()}
            broadcasterId={props.channel.id}
            onDone={() => setChannelForm(null)}
          />
        )}
      </Show>
    </header>
  );
}
