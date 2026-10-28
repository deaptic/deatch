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
import type { MessageKey } from "../../../lib/i18n/index.ts";
import type {
  AnnouncementColor,
  FeedEvent as Event,
  Person,
} from "../../../lib/types/index.ts";

export type Look = {
  color: string;
  Icon: Component<{ class?: string }>;
  title: MessageKey;
};

const LOOKS: Record<string, Look> & { local: Look } = {
  sub: {
    color: "var(--color-event-sub)",
    Icon: Gift,
    title: "EVENT_TITLE_SUB",
  },
  raid: {
    color: "var(--color-event-raid)",
    Icon: Swords,
    title: "EVENT_TITLE_RAID",
  },
  announcement: {
    color: "var(--color-event-announce)",
    Icon: Megaphone,
    title: "EVENT_TITLE_ANNOUNCEMENT",
  },
  charity_donation: {
    color: "var(--color-event-charity)",
    Icon: Heart,
    title: "EVENT_TITLE_CHARITY_DONATION",
  },
  shoutout: {
    color: "var(--color-event-shoutout)",
    Icon: Radio,
    title: "EVENT_TITLE_SHOUTOUT",
  },
  follow: {
    color: "var(--color-event-follow)",
    Icon: UserPlus,
    title: "EVENT_TITLE_FOLLOW",
  },
  bits_badge_tier: {
    color: "var(--color-event-bits)",
    Icon: Gem,
    title: "EVENT_TITLE_BITS_BADGE_TIER",
  },
  channel_points_redemption: {
    color: "var(--color-event-channel-points)",
    Icon: Star,
    title: "EVENT_TITLE_CHANNEL_POINTS_REDEMPTION",
  },
  clip_created: {
    color: "var(--color-accent-ink)",
    Icon: Clapperboard,
    title: "EVENT_TITLE_CLIP_CREATED",
  },
  chat_connected: {
    color: "var(--color-positive)",
    Icon: Plug,
    title: "EVENT_TITLE_CHAT_CONNECTED",
  },
  chat_disconnected: {
    color: "var(--color-ink-faint)",
    Icon: Unplug,
    title: "EVENT_TITLE_CHAT_DISCONNECTED",
  },
  chat_connect_failed: {
    color: "var(--color-negative)",
    Icon: TriangleAlert,
    title: "EVENT_TITLE_CHAT_CONNECT_FAILED",
  },
  chat_cleared: {
    color: "var(--color-caution)",
    Icon: Eraser,
    title: "EVENT_TITLE_CHAT_CLEARED",
  },
  moderation: {
    color: "var(--color-caution)",
    Icon: Shield,
    title: "EVENT_TITLE_MODERATION",
  },
  seventv_update: {
    color: "var(--color-info)",
    Icon: Sparkles,
    title: "EVENT_TITLE_SEVENTV_UPDATE",
  },
  channel_update: {
    color: "var(--color-info)",
    Icon: PenLine,
    title: "EVENT_TITLE_CHANNEL_UPDATE",
  },
  poll: {
    color: "var(--color-event-poll)",
    Icon: Vote,
    title: "EVENT_TITLE_POLL",
  },
  prediction: {
    color: "var(--color-event-channel-points)",
    Icon: Trophy,
    title: "EVENT_TITLE_PREDICTION",
  },
  bits_use: {
    color: "var(--color-event-bits)",
    Icon: Gem,
    title: "EVENT_TITLE_BITS_USE",
  },
  ad_break: {
    color: "var(--color-caution)",
    Icon: Tv,
    title: "EVENT_TITLE_AD_BREAK",
  },
  goal: {
    color: "var(--color-event-goal)",
    Icon: Target,
    title: "EVENT_TITLE_GOAL",
  },
  hype_train: {
    color: "var(--color-event-hype-train)",
    Icon: TrainFront,
    title: "EVENT_TITLE_HYPE_TRAIN",
  },
  shared_chat_session: {
    color: "var(--color-info)",
    Icon: Users,
    title: "EVENT_TITLE_SHARED_CHAT_SESSION",
  },
  stream_online: {
    color: "var(--color-positive)",
    Icon: Video,
    title: "EVENT_TITLE_STREAM_ONLINE",
  },
  stream_offline: {
    color: "var(--color-ink-faint)",
    Icon: VideoOff,
    title: "EVENT_TITLE_STREAM_OFFLINE",
  },
  watch_streak: {
    color: "var(--color-event-channel-points)",
    Icon: Flame,
    title: "EVENT_TITLE_WATCH_STREAK",
  },
  local: {
    color: "var(--color-ink-faint)",
    Icon: Info,
    title: "EVENT_TITLE_LOCAL",
  },
};

/// Types that share their family's look but say what they are.
const TITLES: Record<string, MessageKey> = {
  resub: "EVENT_TITLE_RESUB",
  sub_gift: "EVENT_TITLE_SUB_GIFT",
  community_sub_gift: "EVENT_TITLE_COMMUNITY_SUB_GIFT",
  gift_paid_upgrade: "EVENT_TITLE_GIFT_PAID_UPGRADE",
  prime_paid_upgrade: "EVENT_TITLE_PRIME_PAID_UPGRADE",
  pay_it_forward: "EVENT_TITLE_PAY_IT_FORWARD",
  unraid: "EVENT_TITLE_UNRAID",
};

// Spelled out in full: Tailwind only keeps theme colours whose names it finds
// in the source, so a built-up name would never reach the page.
const ANNOUNCEMENT_COLORS: Record<
  Exclude<AnnouncementColor, "primary">,
  string
> = {
  blue: "var(--color-event-announce-blue)",
  green: "var(--color-event-announce-green)",
  orange: "var(--color-event-announce-orange)",
  purple: "var(--color-event-announce-purple)",
};

/// How an event shows: its colour, icon, and title. A picked announcement
/// colour replaces the type's own.
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

/// The chatter behind an event as a person to link. Local notices have none.
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

/// Everyone the event's sentence names, the chatter first.
export function people(item: Event): Person[] {
  const first = chatter(item);
  return [...(first ? [first] : []), ...(item.people ?? [])];
}

/// A big gift stays a line until someone asks for the rest.
export const RECIPIENTS_SHOWN = 8;
