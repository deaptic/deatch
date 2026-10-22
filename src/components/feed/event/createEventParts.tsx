import {
  Clapperboard,
  Eraser,
  ExternalLink,
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
import { type Component, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { openUrl } from "@tauri-apps/plugin-opener";
import { NOTICE_TO_EVENT } from "../../../lib/constants.ts";
import type {
  AnnouncementColor,
  FeedEvent,
  Person,
} from "../../../lib/types/index.ts";
import type { UserActions } from "../../ui/userLink.ts";
import Timestamp from "../../ui/Timestamp.tsx";
import Toolbar from "../../ui/Toolbar.tsx";
import ToolbarItem from "../../ui/ToolbarItem.tsx";
import FeedTile from "../FeedTile.tsx";
import type { EmoteMap } from "../../../lib/stores/emotes.ts";
import type { CheermoteMap } from "../../../lib/utils/cheermote.ts";
import { t } from "../../../lib/i18n/index.ts";
import Notice from "./Notice.tsx";
import type { ItemLayout, ItemParts } from "../itemParts.ts";

export type EventOptions = UserActions & {
  emotes: EmoteMap;
  cheermotes: CheermoteMap;
  onEventContextMenu?: (x: number, y: number, item: FeedEvent) => void;
};

type Look = { color: string; Icon: Component<{ class?: string }> };

const LOOKS: Record<string, Look> = {
  sub: { color: "var(--color-event-sub)", Icon: Gift },
  raid: { color: "var(--color-event-raid)", Icon: Swords },
  announcement: { color: "var(--color-event-announce)", Icon: Megaphone },
  charity_donation: { color: "var(--color-event-charity)", Icon: Heart },
  shoutout: { color: "var(--color-event-shoutout)", Icon: Radio },
  follow: { color: "var(--color-event-follow)", Icon: UserPlus },
  bits_badge_tier: { color: "var(--color-event-bits)", Icon: Gem },
  channel_points_redemption: {
    color: "var(--color-event-channel-points)",
    Icon: Star,
  },
  clip_created: { color: "var(--color-accent-ink)", Icon: Clapperboard },
  chat_connected: { color: "var(--color-positive)", Icon: Plug },
  chat_disconnected: { color: "var(--color-ink-faint)", Icon: Unplug },
  chat_connect_failed: { color: "var(--color-negative)", Icon: TriangleAlert },
  chat_cleared: { color: "var(--color-caution)", Icon: Eraser },
  moderation: { color: "var(--color-caution)", Icon: Shield },
  seventv_update: { color: "var(--color-info)", Icon: Sparkles },
  channel_update: { color: "var(--color-info)", Icon: PenLine },
  poll: { color: "var(--color-event-poll)", Icon: Vote },
  prediction: { color: "var(--color-event-channel-points)", Icon: Trophy },
  bits_use: { color: "var(--color-event-bits)", Icon: Gem },
  ad_break: { color: "var(--color-caution)", Icon: Tv },
  goal: { color: "var(--color-event-goal)", Icon: Target },
  hype_train: { color: "var(--color-event-hype-train)", Icon: TrainFront },
  shared_chat_session: { color: "var(--color-info)", Icon: Users },
  stream_online: { color: "var(--color-positive)", Icon: Video },
  stream_offline: { color: "var(--color-ink-faint)", Icon: VideoOff },
  local: { color: "var(--color-ink-faint)", Icon: Info },
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

function lookFor(noticeType: string): Look {
  return LOOKS[noticeType] ?? LOOKS[NOTICE_TO_EVENT[noticeType]] ??
    LOOKS.local;
}

export function createEventParts(
  item: FeedEvent,
  props: ItemLayout & EventOptions,
): ItemParts {
  const look = (): Look => {
    const base = lookFor(item.notice_type);
    const picked = item.announcement_color;
    return picked && picked !== "primary"
      ? { ...base, color: ANNOUNCEMENT_COLORS[picked] }
      : base;
  };
  const icon = () => <Dynamic component={look().Icon} />;

  const clipToolbar = () => (
    <Show when={item.clip}>
      {(clip) => (
        <Toolbar alwaysVisible>
          <ToolbarItem
            title={t("EVENT_VIEW_CLIP")}
            tone="success"
            onClick={() => openUrl(`https://clips.twitch.tv/${clip().id}`)}
          >
            <ExternalLink />
          </ToolbarItem>
        </Toolbar>
      )}
    </Show>
  );

  // Only a known chatter becomes a name link; local notices stay text.
  const chatter: Person | undefined = item.chatter_user_id
    ? {
      id: item.chatter_user_id,
      login: item.chatter_login ?? item.chatter_name.toLowerCase(),
      name: item.chatter_name,
      color: item.color,
    }
    : undefined;

  const time = () => (
    <Show when={props.density === "comfortable"}>
      <Timestamp ts={item.timestamp} format="c" variant="inline" />
    </Show>
  );

  const compactIcon = () => (
    <Show when={props.density === "compact"}>
      <span class="feed-icon inline-grid align-text-bottom mr-1.5 text-(--tone)">
        {icon()}
      </span>
    </Show>
  );

  const content = (
    <Notice
      text={item.system_message}
      people={[...(chatter ? [chatter] : []), ...(item.people ?? [])]}
      speaker={chatter}
      words={item.message}
      detail={item.detail}
      recipients={item.recipients}
      lead={compactIcon()}
      trail={time()}
      emotes={props.emotes}
      cheermotes={props.cheermotes}
      onShowUserCard={props.onShowUserCard}
      onUserContextMenu={props.onUserContextMenu}
    />
  );

  return {
    get density() {
      return props.density;
    },
    tone: "event",
    get toneColor() {
      return look().color;
    },
    tile: () => (
      <FeedTile color={look().color}>
        <span class="feed-icon grid">{icon()}</span>
      </FeedTile>
    ),
    overlay: clipToolbar,
    content,
    get onContextMenu() {
      return props.onEventContextMenu &&
        ((x: number, y: number) => props.onEventContextMenu!(x, y, item));
    },
  };
}
