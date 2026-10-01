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
  TriangleAlert,
  Unplug,
  UserPlus,
} from "lucide-solid";
import { type Component, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { openUrl } from "@tauri-apps/plugin-opener";
import { NOTICE_TO_EVENT } from "../../../lib/constants.ts";
import type { FeedEvent } from "../../../lib/types/index.ts";
import Timestamp from "../../ui/Timestamp.tsx";
import Toolbar from "../../ui/Toolbar.tsx";
import ToolbarItem from "../../ui/ToolbarItem.tsx";
import FeedTile from "../FeedTile.tsx";
import type { ItemLayout, ItemParts } from "../itemParts.ts";

export type EventOptions = {
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
  moderate: { color: "var(--color-caution)", Icon: Shield },
  seventv_update: { color: "var(--color-info)", Icon: Sparkles },
  channel_update: { color: "var(--color-info)", Icon: PenLine },
  local: { color: "var(--color-ink-faint)", Icon: Info },
};

function lookFor(noticeType: string): Look {
  const key = noticeType.startsWith("moderate_")
    ? "moderate"
    : NOTICE_TO_EVENT[noticeType] ?? noticeType;
  return LOOKS[key] ?? LOOKS.local;
}

export function createEventParts(
  item: FeedEvent,
  props: ItemLayout & EventOptions,
): ItemParts {
  const look = () => lookFor(item.notice_type);
  const icon = () => <Dynamic component={look().Icon} />;

  const clipToolbar = () => (
    <Show when={item.clip}>
      {(clip) => (
        <Toolbar alwaysVisible>
          <ToolbarItem
            title="View clip"
            tone="success"
            onClick={() => openUrl(`https://clips.twitch.tv/${clip().id}`)}
          >
            <ExternalLink />
          </ToolbarItem>
        </Toolbar>
      )}
    </Show>
  );

  const content = (
    <span class="text-ink">
      <Show when={props.density === "compact"}>
        <span class="feed-icon inline-grid align-text-bottom mr-1.5 text-(--tone)">
          {icon()}
        </span>
      </Show>
      {item.system_message}
      <Show when={props.density === "comfortable"}>
        <Timestamp ts={item.timestamp} format="c" variant="inline" />
      </Show>
    </span>
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
