import { t } from "../../../shared/i18n/index.ts";
import {
  listenEventSub,
  serverTime,
  unlistenAll,
} from "../../../platform/listen.ts";
import { listenFeed } from "./listenFeed.ts";
import type {
  FeedEvent,
  RawAutomaticRedemption,
  RawBitsUse,
  RawChannelPointsRedemption,
  RawFollow,
  RawNotification,
  RawShoutout,
  RawShoutoutReceive,
  Redemption,
} from "../../../lib/types/index.ts";
import { addGiftRecipient, appendItem } from "../store/index.ts";
import { chatterFields, feedEvent } from "../entries/feedEvent.ts";
import * as channelPoints from "../channelPoints.ts";
import { raid } from "../../activity/index.ts";
import { createTimeouts } from "../../../lib/utils/timeouts.ts";
import { mapRedemption } from "../entries/redemption.ts";
import { mapNotice } from "../entries/notice.ts";
import { mapAutomaticRedemption } from "../entries/automaticRedemption.ts";
import { mapBitsUse } from "../entries/bitsUse.ts";
import { giftGroup } from "../entries/giftGroup.ts";
import { mapShoutout, mapShoutoutReceive } from "../entries/shoutout.ts";
import {
  CHANNEL_POINTS_REDEMPTION,
  FOLLOW,
} from "../../../lib/constants/events.ts";

function mapFollow(raw: RawFollow, timestamp: number): FeedEvent {
  return feedEvent(
    FOLLOW,
    t("FEED_FOLLOWED_LINE", { user: raw.user_name }),
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
    t("FEED_REDEMPTION_LINE", {
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
const GIFT_NOTICE_WAIT_MS = 600;

export function start(): () => void {
  const communityRows = new Map<string, string>();
  const timeouts = createTimeouts();
  const stop = unlistenAll([
    listenEventSub<RawNotification>("channel.chat.notification", (e) => {
      const raw = e.event;
      const id = raw.broadcaster_user_id;
      const item = mapNotice(raw, serverTime(e));
      if (!item) return;
      const group = giftGroup(raw);
      if (group?.role === "community") {
        communityRows.set(group.giftId, item.id);
        timeouts.after(GIFT_WINDOW_MS, () =>
          communityRows.delete(group.giftId),
        );
        appendItem(id, item);
      } else if (group?.role === "member") {
        timeouts.after(GIFT_NOTICE_WAIT_MS, () => {
          const row = communityRows.get(group.giftId);
          if (row) addGiftRecipient(id, row, group.recipient);
          else appendItem(id, item);
        });
      } else {
        appendItem(id, item);
      }
      if (raw.notice_type === "raid" && raw.chatter_user_id) {
        raid.shoutOutRaider(id, raw.chatter_user_id);
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
        const raw = e.event;
        const ts = serverTime(e);
        const redemption = mapRedemption(raw);
        channelPoints.correlate(
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
    timeouts.clear();
    communityRows.clear();
  };
}
