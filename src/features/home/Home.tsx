import {
  createMemo,
  createResource,
  createSignal,
  onCleanup,
  Show,
} from "solid-js";
import { onWindowFocusChanged } from "../../platform/window.ts";
import CardTitle from "./CardTitle.tsx";
import PeriodSwitch, { type Period } from "./PeriodSwitch.tsx";
import { t } from "../../shared/i18n/index.ts";
import Surface from "../../kit/Surface.tsx";
import SectionTitle from "../../kit/SectionTitle.tsx";
import Text from "../../kit/Text.tsx";
import * as inbox from "../inbox/index.ts";
import * as link from "../link/index.ts";
import { knownUser, knownUserByLogin, user } from "../users/index.ts";
import type { User } from "../../shared/types/index.ts";
import {
  comingUp,
  ranked,
  homeChannels,
  total,
  type Ranked,
  weekStart,
} from "./model.ts";
import { startOfDay } from "../../shared/time.ts";
import { feedlogActivity } from "../../platform/feedLog.ts";
import TodayStrip, { type Stat, type StatKey } from "./TodayStrip.tsx";
import { getSchedules } from "../../platform/twitch/schedule.ts";
import { pinnedChannels } from "../preferences/index.ts";
import ComingUpCard from "./ComingUpCard.tsx";
import LiveNowCard from "./LiveNowCard.tsx";
import EmotesCard from "./EmotesCard.tsx";
import { liveStreams, streamForUserId } from "../channels/index.ts";
import { formatUptime } from "../../shared/format/stream.ts";
import * as clock from "../../shared/clock.ts";
import JustWentLiveCard from "./JustWentLiveCard.tsx";
import TopClipsCard from "./TopClipsCard.tsx";
import { getTopClips } from "../../platform/twitch/clips.ts";
import { cached } from "./cache.ts";
import YourStreamCard from "./YourStreamCard.tsx";

type Props = {
  onSelectChannel: (channel: User) => void;
};

export default function Home(props: Props) {
  const today = createMemo(() => startOfDay(clock.now()));
  const [report, { refetch }] = createResource(today, (day) =>
    feedlogActivity(
      { todayStart: day, weekStart: weekStart(day) },
      { silent: true },
    ).catch(() => ({ mine: [], busiestToday: [], busiestWeek: [] })),
  );
  const stopFocus = onWindowFocusChanged(
    (focused) => {
      if (focused) void refetch();
    },
    { silent: true },
  );
  onCleanup(() => {
    stopFocus.then((stop) => stop()).catch(() => {});
  });
  const activityRows = () => report()?.mine ?? [];

  const [statsPeriod, setStatsPeriod] = createSignal<Period>("day");
  const [clipsPeriod, setClipsPeriod] = createSignal<Period>("day");
  const sinceOf = (period: Period) =>
    period === "day" ? today() : weekStart(today());
  const since = () => sinceOf(statsPeriod());
  const counts = (rows: { broadcasterId: string; count: number }[]) =>
    ranked(Object.fromEntries(rows.map((r) => [r.broadcasterId, r.count])));
  const stat = (
    rows: Ranked[],
    find: (key: string) => User | undefined,
  ): Stat => ({
    value: total(rows),
    entries: rows.flatMap((row) => {
      const channel = find(row.key);
      return channel ? [{ channel, count: row.count }] : [];
    }),
  });
  const channelIds = createMemo(() =>
    homeChannels(
      pinnedChannels(),
      link.tabs().map((tab) => tab.id),
      liveStreams().map((stream) => stream.user.id),
      activityRows()
        .filter((row) => row.week > 0)
        .map((row) => row.broadcasterId),
    ),
  );
  const channelKey = () => [...channelIds()].sort().join(",") || undefined;
  const [schedules] = createResource(channelKey, (key) =>
    cached(
      `schedules|${key}`,
      () => getSchedules({ broadcasterIds: key.split(",") }, { silent: true }),
      [],
    ),
  );
  const upcoming = () => comingUp(schedules() ?? [], clock.now());
  const clipsQuery = () => {
    const key = channelKey();
    return key ? { key, since: sinceOf(clipsPeriod()) } : undefined;
  };
  const [clips] = createResource(clipsQuery, (query) =>
    cached(
      `clips|${query.since}|${query.key}`,
      () =>
        getTopClips(
          {
            broadcasterIds: query.key.split(","),
            startedAt: new Date(query.since).toISOString(),
          },
          { silent: true },
        ),
      [],
    ),
  );

  const byLogin = (login: string) =>
    link.tabs().find((tab) => tab.login === login) ?? knownUserByLogin(login);
  const stats = createMemo((): Record<StatKey, Stat> => {
    const day = statsPeriod() === "day";
    return {
      sent: stat(
        counts(
          activityRows().map((row) => ({
            broadcasterId: row.broadcasterId,
            count: day ? row.today : row.week,
          })),
        ),
        knownUser,
      ),
      mentions: stat(ranked(inbox.mentionsSince(since())), knownUser),
      points: stat(ranked(link.earnedSince(since())), byLogin),
      activity: stat(
        counts((day ? report()?.busiestToday : report()?.busiestWeek) ?? []),
        knownUser,
      ),
    };
  });

  const ownStream = () => {
    const id = user()?.id;
    return id ? streamForUserId(id) : undefined;
  };

  const summary = () => {
    const live = ownStream();
    const parts = [
      live &&
        t("HOME_LIVE_SUMMARY_VALUE", {
          uptime: formatUptime(live.startedAt, clock.now()),
        }),
      inbox.unreadCount() > 0 &&
        t("HOME_INBOX_SUMMARY_VALUE", { count: inbox.unreadCount() }),
      link.bonusReady().length > 0 &&
        t("HOME_BONUS_SUMMARY_VALUE", { count: link.bonusReady().length }),
    ].filter(Boolean);
    return parts.join(" · ");
  };

  return (
    <div class="flex-1 min-h-0 flex flex-col">
      <Surface as="header" tone="none" edge="bottom" class="shrink-0">
        <div class="h-14 px-5 flex items-center gap-4 min-w-0">
          <SectionTitle>{t("HOME_TITLE")}</SectionTitle>
          <Text size="sm" tone="soft" truncate>
            {summary()}
          </Text>
        </div>
      </Surface>
      <div class="flex-1 min-h-0 overflow-y-auto">
        <div class="w-full px-5 pt-5 pb-12 flex flex-col gap-card-gap">
          <div class="flex flex-col gap-2">
            <CardTitle
              inset={false}
              action={
                <PeriodSwitch value={statsPeriod()} onChange={setStatsPeriod} />
              }
            >
              {t("HOME_ACTIVITY_TITLE")}
            </CardTitle>
            <TodayStrip stats={stats()} />
          </div>
          <div class="home-cards">
            <div class="home-pair">
              <Show when={user()}>
                {(me) => (
                  <div class="home-tile min-h-home-panel">
                    <YourStreamCard
                      channel={me()}
                      onSelect={props.onSelectChannel}
                    />
                  </div>
                )}
              </Show>
              <div class="home-tile min-h-home-panel">
                <EmotesCard />
              </div>
            </div>
            <div class="home-pair">
              <div class="home-tile min-h-home-panel">
                <JustWentLiveCard onSelect={props.onSelectChannel} />
              </div>
              <div class="home-tile min-h-home-panel">
                <ComingUpCard
                  streams={upcoming()}
                  hasChannels={channelIds().length > 0}
                  onSelect={props.onSelectChannel}
                />
              </div>
            </div>
          </div>
          <LiveNowCard onSelect={props.onSelectChannel} />
          <TopClipsCard
            period={clipsPeriod()}
            onPeriodChange={setClipsPeriod}
            clips={clips() ?? []}
            hasChannels={channelIds().length > 0}
          />
        </div>
      </div>
    </div>
  );
}
