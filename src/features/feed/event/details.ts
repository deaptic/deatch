import {
  Clapperboard,
  Eraser,
  Flame,
  Gem,
  Gift,
  Heart,
  Info,
  Megaphone,
  PenLine,
  Plug,
  Radio,
  Shield,
  Sparkles,
  Star,
  Swords,
  Target,
  TrainFront,
  TriangleAlert,
  Trophy,
  Tv,
  Unplug,
  UserPlus,
  Users,
  Video,
  VideoOff,
  Vote,
} from "lucide-solid";
import type { Component } from "solid-js";
import { NOTICE_TO_EVENT } from "../../../lib/constants/events.ts";
import { GROUP_COLORS } from "../groups.ts";
import type { MessageKey } from "../../../shared/i18n/index.ts";
import type {
  AnnouncementColor,
  FeedEvent as Event,
  Person,
} from "../../../lib/types/index.ts";

type Look = {
  color: string;
  Icon: Component<{ class?: string }>;
  title: MessageKey;
};

const LOOKS: Record<string, Look> & { local: Look } = {
  sub: {
    color: GROUP_COLORS.support,
    Icon: Gift,
    title: "FEED_EVENT_SUB_TITLE",
  },
  raid: {
    color: GROUP_COLORS.community,
    Icon: Swords,
    title: "FEED_EVENT_RAID_TITLE",
  },
  announcement: {
    color: "var(--color-accent-ink)",
    Icon: Megaphone,
    title: "FEED_EVENT_ANNOUNCEMENT_TITLE",
  },
  charity_donation: {
    color: GROUP_COLORS.support,
    Icon: Heart,
    title: "FEED_EVENT_CHARITY_TITLE",
  },
  shoutout: {
    color: GROUP_COLORS.community,
    Icon: Radio,
    title: "FEED_EVENT_SHOUTOUT_TITLE",
  },
  follow: {
    color: "var(--color-ink-soft)",
    Icon: UserPlus,
    title: "FEED_EVENT_FOLLOW_TITLE",
  },
  bits_badge_tier: {
    color: GROUP_COLORS.support,
    Icon: Gem,
    title: "FEED_EVENT_BITS_BADGE_TITLE",
  },
  channel_points_redemption: {
    color: GROUP_COLORS.engagement,
    Icon: Star,
    title: "FEED_EVENT_CHANNEL_POINTS_TITLE",
  },
  clip_created: {
    color: "var(--color-accent-ink)",
    Icon: Clapperboard,
    title: "FEED_EVENT_CLIP_TITLE",
  },
  chat_connected: {
    color: "var(--color-positive)",
    Icon: Plug,
    title: "FEED_EVENT_CONNECTED_TITLE",
  },
  chat_disconnected: {
    color: "var(--color-ink-faint)",
    Icon: Unplug,
    title: "FEED_EVENT_DISCONNECTED_TITLE",
  },
  chat_connect_failed: {
    color: "var(--color-negative)",
    Icon: TriangleAlert,
    title: "FEED_EVENT_CONNECT_FAILED_TITLE",
  },
  chat_cleared: {
    color: GROUP_COLORS.moderation,
    Icon: Eraser,
    title: "FEED_EVENT_CHAT_CLEARED_TITLE",
  },
  moderation: {
    color: GROUP_COLORS.moderation,
    Icon: Shield,
    title: "FEED_EVENT_MODERATION_TITLE",
  },
  seventv_update: {
    color: "var(--color-info)",
    Icon: Sparkles,
    title: "FEED_EVENT_SEVENTV_TITLE",
  },
  channel_update: {
    color: "var(--color-info)",
    Icon: PenLine,
    title: "FEED_EVENT_CHANNEL_UPDATE_TITLE",
  },
  poll: {
    color: GROUP_COLORS.engagement,
    Icon: Vote,
    title: "FEED_EVENT_POLL_TITLE",
  },
  prediction: {
    color: GROUP_COLORS.engagement,
    Icon: Trophy,
    title: "FEED_EVENT_PREDICTION_TITLE",
  },
  bits_use: {
    color: GROUP_COLORS.support,
    Icon: Gem,
    title: "FEED_EVENT_POWER_UP_TITLE",
  },
  ad_break: {
    color: "var(--color-caution)",
    Icon: Tv,
    title: "FEED_EVENT_AD_BREAK_TITLE",
  },
  goal: {
    color: GROUP_COLORS.engagement,
    Icon: Target,
    title: "FEED_EVENT_GOAL_TITLE",
  },
  hype_train: {
    color: GROUP_COLORS.support,
    Icon: TrainFront,
    title: "FEED_EVENT_HYPE_TRAIN_TITLE",
  },
  shared_chat_session: {
    color: "var(--color-info)",
    Icon: Users,
    title: "FEED_EVENT_SHARED_CHAT_TITLE",
  },
  stream_online: {
    color: "var(--color-positive)",
    Icon: Video,
    title: "FEED_EVENT_STREAM_ONLINE_TITLE",
  },
  stream_offline: {
    color: "var(--color-ink-faint)",
    Icon: VideoOff,
    title: "FEED_EVENT_STREAM_OFFLINE_TITLE",
  },
  watch_streak: {
    color: GROUP_COLORS.engagement,
    Icon: Flame,
    title: "FEED_EVENT_WATCH_STREAK_TITLE",
  },
  local: {
    color: "var(--color-ink-faint)",
    Icon: Info,
    title: "FEED_EVENT_NOTICE_TITLE",
  },
};

const TITLES: Record<string, MessageKey> = {
  resub: "FEED_EVENT_RESUB_TITLE",
  sub_gift: "FEED_EVENT_SUB_GIFT_TITLE",
  community_sub_gift: "FEED_EVENT_COMMUNITY_SUB_GIFT_TITLE",
  gift_paid_upgrade: "FEED_EVENT_GIFT_PAID_UPGRADE_TITLE",
  prime_paid_upgrade: "FEED_EVENT_PRIME_PAID_UPGRADE_TITLE",
  pay_it_forward: "FEED_EVENT_PAY_IT_FORWARD_TITLE",
  unraid: "FEED_EVENT_RAID_CANCELED_TITLE",
};

const ANNOUNCEMENT_COLORS: Record<
  Exclude<AnnouncementColor, "primary">,
  string
> = {
  blue: "var(--color-event-announce-blue)",
  green: "var(--color-event-announce-green)",
  orange: "var(--color-event-announce-orange)",
  purple: "var(--color-event-announce-purple)",
};

export function look(item: Event): Look {
  const type = item.notice_type.replace(/^shared_chat_/, "");
  const event = NOTICE_TO_EVENT[type];
  const base = LOOKS[type] ?? (event && LOOKS[event]) ?? LOOKS.local;
  const picked = item.announcement_color;
  return {
    ...base,
    title: TITLES[type] ?? base.title,
    color:
      picked && picked !== "primary" ? ANNOUNCEMENT_COLORS[picked] : base.color,
  };
}

function chatter(item: Event): Person | undefined {
  return item.chatter_user_id
    ? {
        id: item.chatter_user_id,
        login: item.chatter_login ?? item.chatter_name.toLowerCase(),
        name: item.chatter_name,
        color: item.color,
      }
    : undefined;
}

export function people(item: Event): Person[] {
  const first = chatter(item);
  return [...(first ? [first] : []), ...(item.people ?? [])];
}

export const RECIPIENTS_SHOWN = 8;
