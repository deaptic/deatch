import {
  Clapperboard,
  Eraser,
  ExternalLink,
  Gem,
  Gift,
  Heart,
  Info,
  Megaphone,
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
import { NOTICE_TO_EVENT } from "../../lib/constants.ts";
import type { FeedEvent as Event } from "../../lib/types/index.ts";
import type { Density } from "../../lib/constants/density.ts";
import Timestamp from "../ui/Timestamp.tsx";
import FeedTile from "./FeedTile.tsx";
import Toolbar from "../ui/Toolbar.tsx";
import ToolbarItem from "../ui/ToolbarItem.tsx";

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
  local: { color: "var(--color-ink-faint)", Icon: Info },
};

function lookFor(noticeType: string): Look {
  const key = noticeType.startsWith("moderate_")
    ? "moderate"
    : NOTICE_TO_EVENT[noticeType] ?? noticeType;
  return LOOKS[key] ?? LOOKS.local;
}

type Props = {
  item: Event;
  density?: Density;
  showTimestamp?: boolean;
  flush?: boolean;
  onContextMenu?: (x: number, y: number, item: Event) => void;
};

export default function FeedEvent(props: Props) {
  const look = () => lookFor(props.item.notice_type);
  return (
    <div
      data-item-id={props.item.id}
      class={`relative group flex items-start leading-normal pl-3 pr-2 ${
        props.density === "comfortable" ? "py-1.5" : "py-1"
      } border-l-3 border-(--event) bg-(--event)/10 ${
        props.flush ? "rounded-r-sm" : "rounded-sm"
      }`}
      style={{ "--event": look().color }}
      onContextMenu={(e) => {
        if (!props.onContextMenu) return;
        e.preventDefault();
        e.stopPropagation();
        props.onContextMenu(e.clientX, e.clientY, props.item);
      }}
    >
      <Show
        when={props.density === "comfortable"}
        fallback={
          <>
            <Show when={props.showTimestamp}>
              <Timestamp ts={props.item.timestamp} variant="column" />
            </Show>
            <div class="flex-1 min-w-0 wrap-break-word text-ink">
              <span class="feed-icon inline-grid align-text-bottom mr-1.5 text-(--event)">
                <Dynamic component={look().Icon} />
              </span>
              {props.item.system_message}
            </div>
          </>
        }
      >
        <FeedTile color={look().color}>
          <span class="feed-icon grid">
            <Dynamic component={look().Icon} />
          </span>
        </FeedTile>
        <div class="flex-1 min-w-0 self-center ml-3 wrap-break-word text-ink">
          {props.item.system_message}
          <Timestamp
            ts={props.item.timestamp}
            variant="inline"
          />
        </div>
      </Show>
      <Show when={props.item.clip}>
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
    </div>
  );
}
