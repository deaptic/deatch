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
import { NOTICE_TO_EVENT } from "../../../shared/moderateActions.ts";
import { GROUP_COLORS } from "../groups.ts";
import { baseType, titleOf } from "./title.ts";
import type { MessageKey } from "../../../shared/i18n/index.ts";
import type { AnnouncementColor } from "../../../shared/types/index.ts";
import type { FeedEvent as Event, Person } from "../types.ts";

type Look = {
  color: string;
  Icon: Component<{ class?: string }>;
};

type Resolved = Look & { title: MessageKey };

const LOOKS: Record<string, Look> & { local: Look } = {
  sub: {
    color: GROUP_COLORS.support,
    Icon: Gift,
  },
  raid: {
    color: GROUP_COLORS.community,
    Icon: Swords,
  },
  announcement: {
    color: "var(--color-accent-ink)",
    Icon: Megaphone,
  },
  charity_donation: {
    color: GROUP_COLORS.support,
    Icon: Heart,
  },
  shoutout: {
    color: GROUP_COLORS.community,
    Icon: Radio,
  },
  follow: {
    color: GROUP_COLORS.community,
    Icon: UserPlus,
  },
  bits_badge_tier: {
    color: GROUP_COLORS.support,
    Icon: Gem,
  },
  channel_points_redemption: {
    color: GROUP_COLORS.engagement,
    Icon: Star,
  },
  clip_created: {
    color: "var(--color-accent-ink)",
    Icon: Clapperboard,
  },
  chat_connected: {
    color: "var(--color-positive)",
    Icon: Plug,
  },
  chat_disconnected: {
    color: "var(--color-ink-faint)",
    Icon: Unplug,
  },
  chat_connect_failed: {
    color: "var(--color-negative)",
    Icon: TriangleAlert,
  },
  chat_cleared: {
    color: GROUP_COLORS.moderation,
    Icon: Eraser,
  },
  moderation: {
    color: GROUP_COLORS.moderation,
    Icon: Shield,
  },
  seventv_update: {
    color: GROUP_COLORS.channel,
    Icon: Sparkles,
  },
  channel_update: {
    color: GROUP_COLORS.channel,
    Icon: PenLine,
  },
  poll: {
    color: GROUP_COLORS.engagement,
    Icon: Vote,
  },
  prediction: {
    color: GROUP_COLORS.engagement,
    Icon: Trophy,
  },
  bits_use: {
    color: GROUP_COLORS.support,
    Icon: Gem,
  },
  ad_break: {
    color: GROUP_COLORS.channel,
    Icon: Tv,
  },
  goal: {
    color: GROUP_COLORS.engagement,
    Icon: Target,
  },
  hype_train: {
    color: GROUP_COLORS.support,
    Icon: TrainFront,
  },
  shared_chat_session: {
    color: GROUP_COLORS.channel,
    Icon: Users,
  },
  stream_online: {
    color: GROUP_COLORS.channel,
    Icon: Video,
  },
  stream_offline: {
    color: GROUP_COLORS.channel,
    Icon: VideoOff,
  },
  watch_streak: {
    color: GROUP_COLORS.community,
    Icon: Flame,
  },
  local: {
    color: "var(--color-ink-faint)",
    Icon: Info,
  },
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

export function look(item: Event): Resolved {
  const type = baseType(item.notice_type);
  const event = NOTICE_TO_EVENT[type];
  const base = LOOKS[type] ?? (event && LOOKS[event]) ?? LOOKS.local;
  const picked = item.announcement_color;
  return {
    ...base,
    title: titleOf(item.notice_type),
    color:
      picked && picked !== "primary" ? ANNOUNCEMENT_COLORS[picked] : base.color,
  };
}

export function author(item: Event): Person | string | undefined {
  if (!item.chatter_name) return undefined;
  return item.chatter_user_id
    ? {
        id: item.chatter_user_id,
        login: item.chatter_login ?? item.chatter_name.toLowerCase(),
        name: item.chatter_name,
        color: item.color,
      }
    : item.chatter_name;
}

export function people(item: Event): Person[] {
  const first = author(item);
  return [
    ...(typeof first === "object" ? [first] : []),
    ...(item.people ?? []),
  ];
}

export const RECIPIENTS_SHOWN = 8;
