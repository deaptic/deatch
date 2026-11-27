import { Clock, Moon, TrendingUp, UserPlus, Users } from "lucide-solid";
import { createResource, createSignal, For, onMount, Show } from "solid-js";
import { getLastStream } from "../../platform/twitch/videos.ts";
import { getSchedules } from "../../platform/twitch/schedule.ts";
import { comingUp } from "./model.ts";
import { cached } from "./cache.ts";
import { Time } from "../../shared/time.ts";
import Sparkline from "../../kit/Sparkline.tsx";
import { t } from "../../shared/i18n/index.ts";
import * as clock from "../../shared/clock.ts";
import {
  formatClock,
  formatCount,
  formatUptime,
  streamGame,
  streamTitle,
} from "../../shared/format/stream.ts";
import Card from "../../kit/Card.tsx";
import CardTitle from "./CardTitle.tsx";
import Stat from "../../kit/Stat.tsx";
import Text from "../../kit/Text.tsx";
import Button from "../../kit/Button.tsx";
import Avatar from "../../kit/Avatar.tsx";
import {
  channelInfoFor,
  followerCount,
  LivePill,
  ownViewers,
  peakViewers,
  refreshFollowers,
  streamForUserId,
} from "../channels/index.ts";
import { ChannelToolForm } from "../channel-tools/index.ts";
import type { User } from "../../shared/types/index.ts";

type Props = {
  channel: User;
  onSelect: (channel: User) => void;
};

export default function YourStreamCard(props: Props) {
  const [editing, setEditing] = createSignal(false);
  const stream = () => streamForUserId(props.channel.id);
  const info = () => channelInfoFor(props.channel.id);
  const [last] = createResource(
    () => props.channel.id,
    (id) =>
      cached(
        `last-stream|${id}`,
        () => getLastStream({ broadcasterId: id }, { silent: true }),
        null,
      ),
  );
  const [schedule] = createResource(
    () => props.channel.id,
    (id) =>
      cached(
        `own-schedule|${id}`,
        () => getSchedules({ broadcasterIds: [id] }, { silent: true }),
        [],
      ),
  );
  const next = () => comingUp(schedule() ?? [], clock.now())[0];
  const facts = () => {
    const followers = followerCount(props.channel.id);
    const previous = last();
    const upcoming = next();
    return [
      {
        label: t("HOME_FOLLOWERS_LABEL"),
        value: followers === undefined ? "—" : formatCount(followers),
      },
      {
        label: t("HOME_LAST_STREAM_LABEL"),
        value: previous
          ? new Time(previous.startedAt, "n").toString()
          : t("HOME_NO_STREAMS_VALUE"),
        tip:
          previous &&
          t("HOME_STREAM_LASTED_VALUE", {
            length: formatClock(previous.seconds * 1000),
          }),
      },
      {
        label: t("HOME_NEXT_STREAM_LABEL"),
        value: upcoming
          ? new Time(upcoming.start, "n").toString()
          : t("HOME_NOT_SCHEDULED_VALUE"),
        tip: upcoming && new Time(upcoming.start, "F").toString(),
      },
    ];
  };
  const title = () => streamTitle(stream(), info());
  const game = () => streamGame(stream(), info());
  const [hovered, setHovered] = createSignal<number | null>(null);
  const series = () => ownViewers();
  const samples = () => series()?.samples ?? [];
  const hoveredSample = () => {
    const i = hovered();
    return i === null ? undefined : samples()[i];
  };
  const newFollowers = () => {
    const start = series()?.followersAtStart;
    const now = followerCount(props.channel.id);
    return start == null || now === undefined ? null : now - start;
  };

  onMount(() => void refreshFollowers(props.channel.id));

  return (
    <Card>
      <div class="flex flex-col h-full">
        <CardTitle
          action={
            <Text size="sm" tone="soft">
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
                <Show
                  when={stream()}
                  fallback={
                    <Stat icon={<Moon />} value={t("HOME_OFFLINE_STATUS")} />
                  }
                >
                  {(s) => (
                    <>
                      <LivePill />
                      <Stat
                        icon={<Users />}
                        value={
                          hoveredSample()
                            ? `${formatCount(hoveredSample()!.viewers)} · ${new Time(hoveredSample()!.at, "t").toString()}`
                            : formatCount(s().viewerCount)
                        }
                      />
                      <Stat
                        icon={<Clock />}
                        value={formatUptime(s().startedAt, clock.now())}
                      />
                    </>
                  )}
                </Show>
              </div>
            </Text>
          }
        >
          {t("HOME_YOUR_STREAM_TITLE")}
        </CardTitle>
        <div class="flex-1 flex flex-col gap-2.5 px-4 pb-3">
          <div class="flex items-center gap-4 min-w-0">
            <Avatar
              src={props.channel.profileImageUrl}
              alt={props.channel.displayName}
              size="md"
              square
              ring={stream() ? "negative" : undefined}
            />
            <div class="flex-1 min-w-0 flex flex-col gap-0.5">
              <Text size="md" bold tone="primary" align="left" truncate>
                {title() || props.channel.displayName}
              </Text>
              <Show when={game()}>
                <Text size="sm" tone="soft" align="left" truncate>
                  {game()}
                </Text>
              </Show>
            </div>
          </div>
          <Show when={!stream()}>
            <div class="grid grid-cols-3 gap-3 pt-1">
              <For each={facts()}>
                {(fact) => (
                  <div
                    class="flex flex-col gap-0.5 min-w-0"
                    data-tip={fact.tip}
                  >
                    <Text size="xs" tone="soft" truncate>
                      {fact.label}
                    </Text>
                    <Text size="sm" tone="primary" truncate>
                      {fact.value}
                    </Text>
                  </div>
                )}
              </For>
            </div>
          </Show>
          <Show when={stream() && samples().length > 1 && series()}>
            {(current) => (
              <div class="flex flex-col gap-1.5">
                <Sparkline
                  values={samples().map((sample) => sample.viewers)}
                  label={t("HOME_VIEWERS_CHART_LABEL")}
                  hovered={hovered()}
                  onHover={setHovered}
                />
                <Text size="sm" tone="soft">
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <Stat
                      icon={<TrendingUp />}
                      value={t("HOME_PEAK_VALUE", {
                        count: formatCount(peakViewers(current())),
                      })}
                    />
                    <Show when={newFollowers()}>
                      {(count) => (
                        <Stat
                          icon={<UserPlus />}
                          value={t("HOME_NEW_FOLLOWERS_VALUE", {
                            count: count(),
                          })}
                        />
                      )}
                    </Show>
                  </div>
                </Text>
              </div>
            )}
          </Show>
          <div class="mt-auto flex flex-wrap gap-2 pt-1">
            <Button
              variant="neutral"
              size="sm"
              onClick={() => setEditing(true)}
            >
              {t("HOME_EDIT_STREAM_LABEL")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => props.onSelect(props.channel)}
            >
              {t("HOME_OPEN_CHAT_LABEL")}
            </Button>
          </div>
        </div>
      </div>
      <Show when={editing()}>
        <ChannelToolForm
          form="info"
          broadcasterId={props.channel.id}
          onDone={() => setEditing(false)}
        />
      </Show>
    </Card>
  );
}
