import { NOTICE_TO_EVENT } from "../../../shared/moderateActions.ts";
import type { MessageKey } from "../../../shared/i18n/index.ts";

const NOTICE_TITLE: MessageKey = "FEED_EVENT_NOTICE_TITLE";

const TITLES: Record<string, MessageKey> = {
  sub: "FEED_EVENT_SUB_TITLE",
  raid: "FEED_EVENT_RAID_TITLE",
  announcement: "FEED_EVENT_ANNOUNCEMENT_TITLE",
  charity_donation: "FEED_EVENT_CHARITY_TITLE",
  shoutout: "FEED_EVENT_SHOUTOUT_TITLE",
  follow: "FEED_EVENT_FOLLOW_TITLE",
  bits_badge_tier: "FEED_EVENT_BITS_BADGE_TITLE",
  channel_points_redemption: "FEED_EVENT_CHANNEL_POINTS_TITLE",
  clip_created: "FEED_EVENT_CLIP_TITLE",
  chat_connected: "FEED_EVENT_CONNECTED_TITLE",
  chat_disconnected: "FEED_EVENT_DISCONNECTED_TITLE",
  chat_connect_failed: "FEED_EVENT_CONNECT_FAILED_TITLE",
  chat_cleared: "FEED_EVENT_CHAT_CLEARED_TITLE",
  moderation: "FEED_EVENT_MODERATION_TITLE",
  seventv_update: "FEED_EVENT_SEVENTV_TITLE",
  channel_update: "FEED_EVENT_CHANNEL_UPDATE_TITLE",
  poll: "FEED_EVENT_POLL_TITLE",
  prediction: "FEED_EVENT_PREDICTION_TITLE",
  bits_use: "FEED_EVENT_POWER_UP_TITLE",
  ad_break: "FEED_EVENT_AD_BREAK_TITLE",
  goal: "FEED_EVENT_GOAL_TITLE",
  hype_train: "FEED_EVENT_HYPE_TRAIN_TITLE",
  shared_chat_session: "FEED_EVENT_SHARED_CHAT_TITLE",
  stream_online: "FEED_EVENT_STREAM_ONLINE_TITLE",
  stream_offline: "FEED_EVENT_STREAM_OFFLINE_TITLE",
  watch_streak: "FEED_EVENT_WATCH_STREAK_TITLE",
  resub: "FEED_EVENT_RESUB_TITLE",
  sub_gift: "FEED_EVENT_SUB_GIFT_TITLE",
  community_sub_gift: "FEED_EVENT_COMMUNITY_SUB_GIFT_TITLE",
  gift_paid_upgrade: "FEED_EVENT_GIFT_PAID_UPGRADE_TITLE",
  prime_paid_upgrade: "FEED_EVENT_PRIME_PAID_UPGRADE_TITLE",
  pay_it_forward: "FEED_EVENT_PAY_IT_FORWARD_TITLE",
  unraid: "FEED_EVENT_RAID_CANCELED_TITLE",
};

export function baseType(noticeType: string): string {
  return noticeType.replace(/^shared_chat_/, "");
}

export function titleOf(noticeType: string): MessageKey {
  const type = baseType(noticeType);
  const event = NOTICE_TO_EVENT[type];
  return TITLES[type] ?? (event && TITLES[event]) ?? NOTICE_TITLE;
}
