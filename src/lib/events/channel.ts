import { t } from "../i18n/index.ts";
import { formatList } from "../format/list.ts";
import { listenEventSub, listenFeed, unlistenAll } from "./listen.ts";
import { formatApproxDuration } from "../format/duration.ts";
import { feedEvent, person } from "../utils/feedEvent.ts";
import { formatAmount } from "../format/currency.ts";
import {
  AD_BREAK,
  CHANNEL_UPDATE,
  CHARITY_CAMPAIGN,
  SHARED_CHAT_SESSION,
  STREAM_OFFLINE,
  STREAM_ONLINE,
} from "../constants/events.ts";
import type {
  RawAdBreak,
  RawCampaignAmount,
  RawChannelUpdate,
  RawCharityCampaign,
  RawSharedChatEnd,
  RawSharedChatSession,
  RawStreamOffline,
  RawStreamOnline,
} from "../types/twitch/eventsub.ts";
import {
  applyChannelInfo,
  channelInfoFor,
  streamForUserId,
} from "../stores/channels.ts";
import { appendLocalNotice } from "../stores/feeds.ts";

function appendSharedChat(
  raw: RawSharedChatSession,
  key: "SHARED_CHAT_BEGIN" | "SHARED_CHAT_UPDATE",
) {
  const partners = raw.participants
    .filter((p) => p.broadcaster_user_id !== raw.broadcaster_user_id)
    .flatMap((p) =>
      person(
        p.broadcaster_user_id,
        p.broadcaster_user_login,
        p.broadcaster_user_name,
      )
    );
  appendLocalNotice(
    raw.broadcaster_user_id,
    {
      text: t(key, { channels: formatList(partners.map((p) => p.name)) }),
      people: partners,
    },
    SHARED_CHAT_SESSION,
  );
}

function campaignAmount(amount: RawCampaignAmount): string {
  return formatAmount({ ...amount, decimal_place: amount.decimal_places });
}

function listenCharity(
  kind: "channel.charity_campaign.start" | "channel.charity_campaign.stop",
  key: "CHARITY_START" | "CHARITY_STOP",
) {
  return listenFeed<RawCharityCampaign>(
    kind,
    (raw, timestamp) =>
      feedEvent(
        CHARITY_CAMPAIGN,
        t(key, {
          charity: raw.charity_name,
          current: campaignAmount(raw.current_amount),
          target: campaignAmount(raw.target_amount),
        }),
        timestamp,
      ),
    (raw) => raw.broadcaster_id,
  );
}

export function start(): () => void {
  return unlistenAll([
    listenEventSub<RawChannelUpdate>("channel.update", (e) => {
      const raw = e.payload.event;
      const id = raw.broadcaster_user_id;
      const before = streamForUserId(id) ?? channelInfoFor(id);
      applyChannelInfo({
        broadcaster: {
          id,
          login: raw.broadcaster_user_login,
          displayName: raw.broadcaster_user_name,
        },
        title: raw.title,
        game: { id: raw.category_id, name: raw.category_name },
      });
      if (!before || before.title !== raw.title) {
        appendLocalNotice(
          id,
          t("CHANNEL_TITLE_CHANGED", { title: raw.title }),
          CHANNEL_UPDATE,
        );
      }
      if (!before || before.game.id !== raw.category_id) {
        appendLocalNotice(
          id,
          t("CHANNEL_CATEGORY_CHANGED", {
            category: raw.category_name || t("CHANNEL_CATEGORY_NONE"),
          }),
          CHANNEL_UPDATE,
        );
      }
    }),
    listenEventSub<RawSharedChatSession>(
      "channel.shared_chat.begin",
      (e) => appendSharedChat(e.payload.event, "SHARED_CHAT_BEGIN"),
    ),
    listenEventSub<RawSharedChatSession>(
      "channel.shared_chat.update",
      (e) => appendSharedChat(e.payload.event, "SHARED_CHAT_UPDATE"),
    ),
    listenEventSub<RawSharedChatEnd>(
      "channel.shared_chat.end",
      (e) =>
        appendLocalNotice(
          e.payload.event.broadcaster_user_id,
          t("SHARED_CHAT_END"),
          SHARED_CHAT_SESSION,
        ),
    ),
    listenFeed<RawAdBreak>(
      "channel.ad_break.begin",
      (raw, timestamp) =>
        feedEvent(
          AD_BREAK,
          {
            text: t("AD_BREAK_BEGIN", {
              duration: formatApproxDuration(raw.duration_seconds),
              automatic: String(raw.is_automatic),
              requester: raw.requester_user_name,
            }),
            people: raw.is_automatic ? [] : person(
              raw.requester_user_id,
              raw.requester_user_login,
              raw.requester_user_name,
            ),
          },
          timestamp,
        ),
    ),
    listenCharity("channel.charity_campaign.start", "CHARITY_START"),
    listenCharity("channel.charity_campaign.stop", "CHARITY_STOP"),
    listenEventSub<RawStreamOnline>("stream.online", (e) => {
      const raw = e.payload.event;
      appendLocalNotice(
        raw.broadcaster_user_id,
        t("STREAM_ONLINE", {
          channel: raw.broadcaster_user_name,
          type: raw.type,
        }),
        STREAM_ONLINE,
      );
    }),
    listenEventSub<RawStreamOffline>("stream.offline", (e) => {
      const raw = e.payload.event;
      appendLocalNotice(
        raw.broadcaster_user_id,
        t("STREAM_OFFLINE", { channel: raw.broadcaster_user_name }),
        STREAM_OFFLINE,
      );
    }),
  ]);
}
