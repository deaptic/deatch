import { createEffect, createRoot, onCleanup } from "solid-js";
import {
  listenApp,
  listenEventSub,
  unlistenAll,
} from "../../platform/listen.ts";
import type {
  RawAutomodMessageHold,
  RawChannelPointsRedemption,
  RawFollow,
  RawNotification,
  RawUnbanRequestCreate,
} from "../../platform/twitch/eventsubPayloads.ts";
import { addToast } from "../../kit/toasts.ts";
import { t } from "../../shared/i18n/index.ts";
import { alertOn, pinnedChannels } from "../preferences/index.ts";
import { knownUser, user } from "../users/index.ts";
import { followedLive, liveStreams } from "../channels/index.ts";
import * as activity from "../activity/index.ts";
import { newlyLive, supportAlert } from "./model.ts";

const AD_WARNING_MS = 60_000;

const isOwn = (broadcasterId: string) => broadcasterId === user()?.id;
const channelName = (id: string) => knownUser(id)?.displayName ?? "";

function notice(raw: RawNotification): void {
  if (!isOwn(raw.broadcaster_user_id)) return;
  if (raw.notice_type === "raid" && raw.raid && alertOn("raids")) {
    addToast(
      t("ALERTS_RAID_TOAST", {
        name: raw.raid.user_name,
        count: raw.raid.viewer_count,
      }),
      "success",
    );
  }
  const support = supportAlert(raw);
  if (support && alertOn("followsAndSubs")) {
    addToast(
      t(support.key, {
        ...support.values,
        name: support.name ?? t("ALERTS_ANONYMOUS_VALUE"),
      }),
      "success",
    );
  }
}

function watchGoingLive(): void {
  const seen = new Set<string>();
  let seeded = false;
  createEffect(() => {
    const followed = followedLive();
    if (followed === null) {
      seen.clear();
      seeded = false;
      return;
    }
    const streams = liveStreams();
    if (seeded && alertOn("goingLive")) {
      const watched = new Set([
        ...followed.map((u) => u.id),
        ...pinnedChannels(),
      ]);
      for (const stream of newlyLive(streams, watched, seen, Date.now())) {
        addToast(
          t("ALERTS_LIVE_TOAST", { name: stream.user.displayName }),
          "info",
          stream.title,
        );
      }
    }
    for (const stream of streams) seen.add(stream.id);
    seeded = true;
  });
}

function watchAdBreaks(): void {
  createEffect(() => {
    const own = user()?.id;
    if (own) activity.refreshAds(own);
  });
  createEffect(() => {
    const own = user()?.id;
    if (!own || !alertOn("adBreaks")) return;
    const ads = activity.forChannel(own).ads;
    const at = ads?.nextAdMs;
    if (!ads || !at || at <= Date.now()) return;
    const canSnooze = ads.snoozeCount > 0;
    const timer = setTimeout(
      () =>
        addToast(
          t("ALERTS_AD_BREAK_TOAST"),
          "warn",
          canSnooze ? t("ALERTS_AD_BREAK_SNOOZE_HINT") : undefined,
          canSnooze ? () => activity.snoozeAd(own) : undefined,
        ),
      Math.max(0, at - AD_WARNING_MS - Date.now()),
    );
    onCleanup(() => clearTimeout(timer));
  });
}

function connectionAlerts() {
  let wasConnected: boolean | null = null;
  return ({ connected }: { connected: boolean }) => {
    if (alertOn("connection") && wasConnected !== null) {
      if (wasConnected && !connected) {
        addToast(t("ALERTS_DISCONNECTED_TOAST"), "warn");
      } else if (!wasConnected && connected) {
        addToast(t("ALERTS_RECONNECTED_TOAST"), "success");
      }
    }
    wasConnected = connected;
  };
}

export function start(): () => void {
  const dispose = createRoot((dispose) => {
    watchGoingLive();
    watchAdBreaks();
    return dispose;
  });
  const stop = unlistenAll([
    listenEventSub<RawNotification>("channel.chat.notification", (e) =>
      notice(e.event),
    ),
    listenEventSub<RawFollow>("channel.follow", (e) => {
      if (!isOwn(e.event.broadcaster_user_id) || !alertOn("followsAndSubs"))
        return;
      addToast(
        t("ALERTS_FOLLOW_TOAST", { name: e.event.user_name }),
        "success",
      );
    }),
    listenEventSub<RawChannelPointsRedemption>(
      "channel.channel_points_custom_reward_redemption.add",
      (e) => {
        const raw = e.event;
        if (!isOwn(raw.broadcaster_user_id) || raw.status !== "unfulfilled")
          return;
        if (!alertOn("redemptions")) return;
        addToast(
          t("ALERTS_REDEMPTION_TOAST", {
            name: raw.user_name,
            reward: raw.reward.title,
          }),
          "info",
          raw.user_input || undefined,
        );
      },
    ),
    listenEventSub<RawAutomodMessageHold>("automod.message.hold", (e) => {
      if (!alertOn("automod")) return;
      const raw = e.event;
      addToast(
        t("ALERTS_AUTOMOD_TOAST", { channel: raw.broadcaster_user_name }),
        "warn",
        `${raw.user_name}: ${raw.message.text}`,
      );
    }),
    listenEventSub<RawUnbanRequestCreate>(
      "channel.unban_request.create",
      (e) => {
        if (!alertOn("unbanRequests")) return;
        const raw = e.event;
        addToast(
          t("ALERTS_UNBAN_REQUEST_TOAST", {
            channel: channelName(raw.broadcaster_user_id),
          }),
          "info",
          `${raw.user_name}: ${raw.text}`,
        );
      },
    ),
    listenApp("eventSubConnection", connectionAlerts()),
  ]);
  return () => {
    dispose();
    stop();
  };
}
