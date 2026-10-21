import { t } from "../i18n/index.ts";
import { listenEventSub, serverTime, unlistenAll } from "./listen.ts";
import type {
  FeedEvent,
  RawFollow,
  RawNotification,
  RawShoutout,
  Redemption,
} from "../types/index.ts";
import type {
  RawAutomaticRedemption,
  RawBitsUse,
  RawChannelPointsRedemption,
  RawShoutoutReceive,
} from "../types/twitch/eventsub.ts";
import { appendItem } from "../stores/feeds.ts";
import { feedEvent, withDetail } from "../utils/feedEvent.ts";
import { isModOfChannel } from "../stores/users.ts";
import { moderationAutoShoutoutOnRaid } from "../stores/preferences.ts";
import { sendShoutout } from "../api/twitch/chat.ts";
import { correlateRedemption } from "./channelPointsCorrelator.ts";
import { mapRedemption } from "./redemption-mapper.ts";
import { mapNotice } from "./notice-mapper.ts";
import { mapAutomaticRedemption } from "./automatic-redemption-mapper.ts";
import { mapBitsUse } from "./bits-use-mapper.ts";

function mapShoutout(raw: RawShoutout, timestamp: number): FeedEvent {
  return feedEvent(
    "shoutout",
    t("EVENT_SHOUTOUT", { channel: raw.to_broadcaster_user_name }),
    timestamp,
    { chatter_name: raw.moderator_user_name },
  );
}

function mapShoutoutReceive(
  raw: RawShoutoutReceive,
  timestamp: number,
): FeedEvent {
  return feedEvent(
    "shoutout",
    t("EVENT_SHOUTOUT_RECEIVED", {
      channel: raw.from_broadcaster_user_name,
      count: raw.viewer_count,
    }),
    timestamp,
    {
      chatter_user_id: raw.from_broadcaster_user_id,
      chatter_login: raw.from_broadcaster_user_login,
      chatter_name: raw.from_broadcaster_user_name,
    },
  );
}

function mapFollow(raw: RawFollow, timestamp: number): FeedEvent {
  return feedEvent(
    "follow",
    t("EVENT_FOLLOW", { user: raw.user_name }),
    timestamp,
    {
      chatter_user_id: raw.user_id,
      chatter_login: raw.user_login,
      chatter_name: raw.user_name,
    },
  );
}

function redemptionEvent(
  raw: RawChannelPointsRedemption,
  redemption: Redemption,
  timestamp: number,
): FeedEvent {
  return feedEvent(
    "channel_points_redemption",
    withDetail(
      t("EVENT_REDEMPTION", {
        user: raw.user_name,
        reward: raw.reward.title,
        cost: raw.reward.cost,
      }),
      redemption.input,
    ),
    timestamp,
    {
      id: raw.id,
      chatter_user_id: raw.user_id,
      chatter_login: raw.user_login,
      chatter_name: raw.user_name,
      redemption,
    },
  );
}

export function start(): () => void {
  return unlistenAll([
    listenEventSub<RawNotification>("channel.chat.notification", (e) => {
      const raw = e.payload.event;
      const id = raw.broadcaster_user_id;
      const item = mapNotice(raw, serverTime(e.payload));
      if (!item) return;
      if (raw.notice_type === "sub_gift") {
        setTimeout(() => appendItem(id, item), 600);
      } else {
        appendItem(id, item);
      }
      if (
        raw.notice_type === "raid" &&
        moderationAutoShoutoutOnRaid() &&
        raw.chatter_user_id &&
        isModOfChannel(id)
      ) {
        sendShoutout({
          fromBroadcasterId: id,
          toBroadcasterId: raw.chatter_user_id,
        }).catch(() => {});
      }
    }),
    listenEventSub<RawShoutout>("channel.shoutout.create", (e) => {
      const raw = e.payload.event;
      appendItem(
        raw.broadcaster_user_id,
        mapShoutout(raw, serverTime(e.payload)),
      );
    }),
    listenEventSub<RawShoutoutReceive>("channel.shoutout.receive", (e) => {
      const raw = e.payload.event;
      appendItem(
        raw.broadcaster_user_id,
        mapShoutoutReceive(raw, serverTime(e.payload)),
      );
    }),
    listenEventSub<RawFollow>("channel.follow", (e) => {
      const raw = e.payload.event;
      appendItem(
        raw.broadcaster_user_id,
        mapFollow(raw, serverTime(e.payload)),
      );
    }),
    listenEventSub<RawChannelPointsRedemption>(
      "channel.channel_points_custom_reward_redemption.add",
      (e) => {
        const raw = e.payload.event;
        const ts = serverTime(e.payload);
        const redemption = mapRedemption(raw);
        correlateRedemption(
          raw.broadcaster_user_id,
          raw.user_id,
          redemption,
          () =>
            appendItem(
              raw.broadcaster_user_id,
              redemptionEvent(raw, redemption, ts),
            ),
        );
      },
    ),
    listenEventSub<RawAutomaticRedemption>(
      "channel.channel_points_automatic_reward_redemption.add",
      (e) => {
        const raw = e.payload.event;
        const item = mapAutomaticRedemption(raw, serverTime(e.payload));
        if (item) appendItem(raw.broadcaster_user_id, item);
      },
    ),
    listenEventSub<RawBitsUse>("channel.bits.use", (e) => {
      const raw = e.payload.event;
      const item = mapBitsUse(raw, serverTime(e.payload));
      if (item) appendItem(raw.broadcaster_user_id, item);
    }),
  ]);
}
