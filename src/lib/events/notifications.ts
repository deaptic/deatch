import { t } from "../i18n/index.ts";
import {
  listenEventSub,
  listenFeed,
  serverTime,
  unlistenAll,
} from "./listen.ts";
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
import { addGiftRecipient, appendItem } from "../stores/feeds.ts";
import { chatterFields, feedEvent } from "../utils/feedEvent.ts";
import { isModOfChannel } from "../stores/users.ts";
import { moderationAutoShoutoutOnRaid } from "../stores/preferences.ts";
import { sendShoutout } from "../api/twitch/chat.ts";
import { correlateRedemption } from "./channelPointsCorrelator.ts";
import { mapRedemption } from "./redemption-mapper.ts";
import { mapNotice } from "./notice-mapper.ts";
import { mapAutomaticRedemption } from "./automatic-redemption-mapper.ts";
import { mapBitsUse } from "./bits-use-mapper.ts";
import { giftGroup } from "./gift-group.ts";
import { mapShoutout, mapShoutoutReceive } from "./shoutout-mapper.ts";
import { CHANNEL_POINTS_REDEMPTION } from "../constants/events.ts";

function mapFollow(raw: RawFollow, timestamp: number): FeedEvent {
  return feedEvent(
    "follow",
    t("EVENT_FOLLOW", { user: raw.user_name }),
    timestamp,
    chatterFields(raw.user_id, raw.user_login, raw.user_name),
  );
}

function redemptionEvent(
  raw: RawChannelPointsRedemption,
  redemption: Redemption,
  timestamp: number,
): FeedEvent {
  return feedEvent(
    CHANNEL_POINTS_REDEMPTION,
    t("EVENT_REDEMPTION", {
      user: raw.user_name,
      reward: raw.reward.title,
      cost: raw.reward.cost,
    }),
    timestamp,
    {
      id: raw.id,
      ...chatterFields(raw.user_id, raw.user_login, raw.user_name),
      message: redemption.input
        ? [{ type: "text", text: redemption.input }]
        : undefined,
    },
  );
}

const GIFT_WINDOW_MS = 60_000;

export function start(): () => void {
  // Community gift id → its feed row, while its subs are still arriving.
  const communityRows = new Map<string, string>();
  const stop = unlistenAll([
    listenEventSub<RawNotification>("channel.chat.notification", (e) => {
      const raw = e.payload.event;
      const id = raw.broadcaster_user_id;
      const item = mapNotice(raw, serverTime(e.payload));
      if (!item) return;
      const group = giftGroup(raw);
      if (group?.role === "community") {
        communityRows.set(group.giftId, item.id);
        setTimeout(() => communityRows.delete(group.giftId), GIFT_WINDOW_MS);
        appendItem(id, item);
      } else if (group?.role === "member") {
        // Twitch may send the gifts before the community notice they belong to.
        setTimeout(() => {
          const row = communityRows.get(group.giftId);
          if (row) addGiftRecipient(id, row, group.recipient);
          else appendItem(id, item);
        }, 600);
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
    listenFeed<RawShoutout>("channel.shoutout.create", mapShoutout),
    listenFeed<RawShoutoutReceive>(
      "channel.shoutout.receive",
      mapShoutoutReceive,
    ),
    listenFeed<RawFollow>("channel.follow", mapFollow),
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
    listenFeed<RawAutomaticRedemption>(
      "channel.channel_points_automatic_reward_redemption.add",
      mapAutomaticRedemption,
    ),
    listenFeed<RawBitsUse>("channel.bits.use", mapBitsUse),
  ]);
  return () => {
    stop();
    communityRows.clear();
  };
}
