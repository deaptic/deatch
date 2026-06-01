import { listen } from "@tauri-apps/api/event";
import type {
  FeedEvent,
  RawFollow,
  RawNotification,
  RawShoutout,
} from "../types/index.ts";
import type {
  EventEnvelope,
  RawChannelPointsRedemption,
} from "../types/twitch/eventsub.ts";
import { appendItem } from "../stores/feeds.ts";
import { isModOfChannel } from "../stores/users.ts";
import { moderationAutoShoutoutOnRaid } from "../stores/preferences.ts";
import { sendShoutout } from "../api/twitch/chat.ts";
import { correlateRedemption } from "./channelPointsCorrelator.ts";

// Most notices ship a complete `system_message` that already starts with the
// chatter name (e.g. resub: "viewer23 subscribed at Tier 1..."). A few
// undocumented types (e.g. modiversary) omit it, sending just the predicate
// ("has been a moderator for 84 months!"), so we prepend the name for those.
const NOTICES_NEEDING_NAME = new Set(["modiversary"]);

function mapNotice(raw: RawNotification, timestamp: number): FeedEvent {
  const name = raw.chatter_user_name;
  let system_message = raw.system_message;
  if (
    name &&
    NOTICES_NEEDING_NAME.has(raw.notice_type) &&
    !system_message.toLowerCase().startsWith(name.toLowerCase())
  ) {
    system_message = `${name} ${system_message}`;
  }
  return {
    kind: "event",
    id: crypto.randomUUID(),
    notice_type: raw.notice_type,
    system_message,
    chatter_user_id: raw.chatter_is_anonymous ? undefined : raw.chatter_user_id,
    chatter_name: raw.chatter_user_name ?? "anonymous",
    color: raw.color ?? "",
    timestamp,
  };
}

function mapShoutout(raw: RawShoutout, timestamp: number): FeedEvent {
  return {
    kind: "event",
    id: crypto.randomUUID(),
    notice_type: "shoutout",
    system_message: `Shoutout to ${raw.to_broadcaster_user_name}!`,
    chatter_name: raw.moderator_user_name,
    color: "",
    timestamp,
  };
}

function mapFollow(raw: RawFollow, timestamp: number): FeedEvent {
  return {
    kind: "event",
    id: crypto.randomUUID(),
    notice_type: "follow",
    system_message: `${raw.user_name} followed!`,
    chatter_user_id: raw.user_id,
    chatter_name: raw.user_name,
    color: "",
    timestamp,
  };
}

function mapRedemption(
  raw: RawChannelPointsRedemption,
  timestamp: number,
): FeedEvent {
  const input = raw.user_input.trim();
  const system_message = input
    ? `${raw.user_name} redeemed ${raw.reward.title}: ${input}`
    : `${raw.user_name} redeemed ${raw.reward.title}`;
  return {
    kind: "event",
    id: raw.id,
    notice_type: "channel_points_redemption",
    system_message,
    chatter_user_id: raw.user_id,
    chatter_name: raw.user_name,
    color: "",
    timestamp,
  };
}

listen<EventEnvelope<RawNotification>>("channel-chat-notification", (e) => {
  const raw = e.payload.event;
  const id = raw.broadcaster_user_id;
  if (!raw.system_message?.trim()) return;
  const item = mapNotice(raw, Date.now());
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
});

listen<EventEnvelope<RawShoutout>>("channel-shoutout-create", (e) => {
  const raw = e.payload.event;
  appendItem(raw.broadcaster_user_id, mapShoutout(raw, Date.now()));
});

listen<EventEnvelope<RawFollow>>("channel-follow", (e) => {
  const raw = e.payload.event;
  appendItem(raw.broadcaster_user_id, mapFollow(raw, Date.now()));
});

listen<EventEnvelope<RawChannelPointsRedemption>>(
  "channel-points-redemption-add",
  (e) => {
    const raw = e.payload.event;
    const ts = Date.now();
    correlateRedemption(
      raw.broadcaster_user_id,
      raw.user_id,
      raw.reward.id,
      raw.reward.title,
      () => appendItem(raw.broadcaster_user_id, mapRedemption(raw, ts)),
    );
  },
);
