import { Time } from "../../shared/time.ts";
import Boundary from "../../kit/Boundary.tsx";
import {
  Clock,
  Gamepad2,
  Heart,
  Info,
  Moon,
  Pencil,
  Users,
  UsersRound,
} from "lucide-solid";
import { type JSX, Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import {
  LiveBadge,
  channelInfoFor,
  followerCount,
  streamForUserId,
} from "../channels/index.ts";
import * as clock from "../../shared/clock.ts";
import {
  formatUptime,
  formatCount,
  streamDetails,
  streamGame,
  streamTitle,
} from "../../shared/format/stream.ts";
import { createCopyable } from "../../kit/copyable.ts";
import type { User } from "../../shared/types/index.ts";
import Avatar from "../../kit/Avatar.tsx";
import Stat from "../../kit/Stat.tsx";
import { createChannelLink } from "../menus/index.ts";
import { hasPermission, showsControls } from "../permissions/index.ts";
import { ChannelToolForm } from "../channel-tools/index.ts";
import {
  channelForm,
  setChannelForm,
  isOverlayOpen,
  toggleOverlay,
} from "../navigation/index.ts";
import IconButton from "../../kit/IconButton.tsx";
import { ActivityMenuButton, ActivityStrip } from "../activity/index.ts";
import ConnectionBanner from "./ui/ConnectionBanner.tsx";
import { chatConnected } from "./connection.ts";
import Transition from "../../kit/Transition.tsx";
import Surface from "../../kit/Surface.tsx";

type Props = {
  channel: User;
  onOpenChannel: (broadcasterId: string) => void;
  onJumpToMessage: (messageId: string) => void;
};

export default function ChannelHeader(props: Props) {
  const stream = () => streamForUserId(props.channel.id);
  const info = () => channelInfoFor(props.channel.id);
  const followers = () => followerCount(props.channel.id);
  const details = () => {
    const s = stream();
    return s ? streamDetails(s) : "";
  };
  const title = () => streamTitle(stream(), info());
  const game = () => streamGame(stream(), info());
  const link = createChannelLink(() => props.channel);
  const name = createCopyable("text-ink");
  const titleCopy = createCopyable("text-ink-soft");

  const isBroadcaster = () => hasPermission(props.channel.id, "manageStream");
  const avatar = (overlay?: JSX.Element) => (
    <Avatar
      src={props.channel.profileImageUrl}
      alt={props.channel.displayName}
      size={64}
      square
      overlay={overlay}
    >
      <LiveBadge live={!!stream()} look="icon" />
    </Avatar>
  );
  const uptime = () => {
    const s = stream();
    return s ? formatUptime(s.startedAt, clock.now()) : "";
  };

  return (
    <Surface as="header" edge="bottom" class="shrink-0 flex flex-col">
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
              class={`shrink-0 max-w-1/2 text-2xl truncate ${name.class()}`}
              {...name.handlers(() => props.channel.displayName)}
            >
              {props.channel.displayName}
            </h1>
            <div class="ml-auto min-w-0 flex items-center gap-5 text-base">
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
                      value={formatCount(s().viewerCount)}
                      copy={String(s().viewerCount)}
                      tip={t("HEADER_VIEWERS_STATUS", {
                        count: s().viewerCount,
                      })}
                    />
                    <Stat
                      icon={<Clock />}
                      value={uptime()}
                      copy={uptime()}
                      tip={t("HEADER_LIVE_SINCE_STATUS", {
                        time: new Time(s().startedAt, "f").toString(),
                      })}
                    />
                  </>
                )}
              </Show>
              <Show when={followers() !== undefined}>
                <Stat
                  icon={<Heart />}
                  value={formatCount(followers() ?? 0)}
                  copy={String(followers())}
                  tip={t("HEADER_FOLLOWERS_STATUS", {
                    count: followers() ?? 0,
                  })}
                />
              </Show>
            </div>
          </div>
          <Show
            when={
              title() || stream() || showsControls(props.channel.id, "moderate")
            }
          >
            <div class="mt-1 flex items-center gap-2 min-w-0">
              <p
                class={`min-w-0 text-base truncate ${titleCopy.class()}`}
                data-tip={title()}
                {...titleCopy.handlers(title)}
              >
                {title()}
              </p>
              <span class="ml-auto shrink-0 -my-1 flex items-center gap-1">
                <Show when={details()}>
                  {(tip) => (
                    <IconButton
                      label={t("HEADER_STREAM_DETAILS_LABEL")}
                      tip={tip()}
                      size="sm"
                    >
                      <Info class="size-4" />
                    </IconButton>
                  )}
                </Show>
                <Show when={showsControls(props.channel.id, "moderate")}>
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
      <Transition when={!chatConnected()}>
        {() => <ConnectionBanner />}
      </Transition>
      <Show when={showsControls(props.channel.id, "moderate")}>
        <Boundary silent>
          <ActivityStrip
            broadcasterId={props.channel.id}
            onOpenChannel={props.onOpenChannel}
            onJumpToMessage={props.onJumpToMessage}
          />
        </Boundary>
      </Show>
      {link.menu()}
      <Show when={channelForm()}>
        {(form) => (
          <Boundary silent>
            <ChannelToolForm
              form={form()}
              broadcasterId={props.channel.id}
              onDone={() => setChannelForm(null)}
            />
          </Boundary>
        )}
      </Show>
    </Surface>
  );
}
