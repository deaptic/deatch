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
} from "../types/index.ts";
import {
  applyChannelInfo,
  channelInfoFor,
  streamForUserId,
} from "../stores/channels.ts";
import { appendLocalNotice } from "../stores/feeds.ts";

function appendSharedChat(
  raw: RawSharedChatSession,
  key: "FEED_SHARED_CHAT_STARTED_LINE" | "FEED_SHARED_CHAT_UPDATED_LINE",
) {
  const partners = raw.participants
    .filter((p) => p.broadcaster_user_id !== raw.broadcaster_user_id)
    .flatMap((p) =>
      person(
        p.broadcaster_user_id,
        p.broadcaster_user_login,
        p.broadcaster_user_name,
      ),
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
  key: "FEED_CHARITY_STARTED_LINE" | "FEED_CHARITY_ENDED_LINE",
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
      const raw = e.event;
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
          t("FEED_TITLE_CHANGED_LINE", { title: raw.title }),
          CHANNEL_UPDATE,
        );
      }
      if (!before || before.game.id !== raw.category_id) {
        appendLocalNotice(
          id,
          t("FEED_CATEGORY_CHANGED_LINE", {
            category: raw.category_name || t("FEED_CATEGORY_NONE_VALUE"),
          }),
          CHANNEL_UPDATE,
        );
      }
    }),
    listenEventSub<RawSharedChatSession>("channel.shared_chat.begin", (e) =>
      appendSharedChat(e.event, "FEED_SHARED_CHAT_STARTED_LINE"),
    ),
    listenEventSub<RawSharedChatSession>("channel.shared_chat.update", (e) =>
      appendSharedChat(e.event, "FEED_SHARED_CHAT_UPDATED_LINE"),
    ),
    listenEventSub<RawSharedChatEnd>("channel.shared_chat.end", (e) =>
      appendLocalNotice(
        e.event.broadcaster_user_id,
        t("FEED_SHARED_CHAT_ENDED_LINE"),
        SHARED_CHAT_SESSION,
      ),
    ),
    listenFeed<RawAdBreak>("channel.ad_break.begin", (raw, timestamp) =>
      feedEvent(
        AD_BREAK,
        {
          text: t("FEED_AD_BREAK_STARTED_LINE", {
            duration: formatApproxDuration(raw.duration_seconds),
            automatic: String(raw.is_automatic),
            requester: raw.requester_user_name,
          }),
          people: raw.is_automatic
            ? []
            : person(
                raw.requester_user_id,
                raw.requester_user_login,
                raw.requester_user_name,
              ),
        },
        timestamp,
      ),
    ),
    listenCharity(
      "channel.charity_campaign.start",
      "FEED_CHARITY_STARTED_LINE",
    ),
    listenCharity("channel.charity_campaign.stop", "FEED_CHARITY_ENDED_LINE"),
    listenEventSub<RawStreamOnline>("stream.online", (e) => {
      const raw = e.event;
      appendLocalNotice(
        raw.broadcaster_user_id,
        t("FEED_STREAM_ONLINE_LINE", {
          channel: raw.broadcaster_user_name,
          type: raw.type,
        }),
        STREAM_ONLINE,
      );
    }),
    listenEventSub<RawStreamOffline>("stream.offline", (e) => {
      const raw = e.event;
      appendLocalNotice(
        raw.broadcaster_user_id,
        t("FEED_STREAM_OFFLINE_LINE", { channel: raw.broadcaster_user_name }),
        STREAM_OFFLINE,
      );
    }),
  ]);
}
