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
import { type Component, For, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { openUrl } from "@tauri-apps/plugin-opener";
import { NOTICE_TO_EVENT } from "../../../lib/constants.ts";
import type { FeedEvent } from "../../../lib/types/index.ts";
import { knownChatterColor } from "../../../lib/stores/users.ts";
import DisplayName from "../../ui/DisplayName.tsx";
import type { UserActions } from "../../ui/userLink.ts";
import Timestamp from "../../ui/Timestamp.tsx";
import Toolbar from "../../ui/Toolbar.tsx";
import ToolbarItem from "../../ui/ToolbarItem.tsx";
import FeedTile from "../FeedTile.tsx";
import RedemptionReward from "../RedemptionReward.tsx";
import MessageFragment from "../message/MessageFragment.tsx";
import type { EmoteMap } from "../../../lib/stores/emotes.ts";
import type { CheermoteMap } from "../../../lib/utils/cheermote.ts";
import { splitName } from "./splitName.ts";
import { t } from "../../../lib/i18n/index.ts";
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
  local: { color: "var(--color-ink-faint)", Icon: Info },
};

function lookFor(noticeType: string): Look {
  return LOOKS[NOTICE_TO_EVENT[noticeType] ?? noticeType] ?? LOOKS.local;
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

  // Only a known chatter becomes a name link; mod and local notices stay text.
  const named = () =>
    item.chatter_user_id
      ? splitName(item.system_message, item.chatter_name)
      : null;

  const chatterName = (shown: string) => (
    <DisplayName
      login={item.chatter_login ?? item.chatter_name.toLowerCase()}
      displayName={shown}
      color={item.color ||
        (item.chatter_user_id
          ? knownChatterColor(item.chatter_user_id)
          : undefined)}
      userId={item.chatter_user_id}
      onShowUserCard={props.onShowUserCard}
      onUserContextMenu={props.onUserContextMenu}
    />
  );

  const time = () => (
    <Show when={props.density === "comfortable"}>
      <Timestamp ts={item.timestamp} format="c" variant="inline" />
    </Show>
  );

  const content = (
    <span class="text-ink">
      <Show when={props.density === "compact"}>
        <span class="feed-icon inline-grid align-text-bottom mr-1.5 text-(--tone)">
          {icon()}
        </span>
      </Show>
      <Show
        when={item.redemption}
        fallback={
          <>
            <Show when={named()} fallback={item.system_message}>
              {(n) => (
                <>
                  {n().before}
                  {chatterName(n().name)}
                  {n().after}
                </>
              )}
            </Show>
            {time()}
            <Show when={item.message}>
              {(fragments) => (
                <span class="block">
                  <For each={fragments()}>
                    {(frag) => (
                      <MessageFragment
                        frag={frag}
                        emotes={props.emotes}
                        cheermotes={props.cheermotes}
                        onShowUserCard={props.onShowUserCard}
                        onUserContextMenu={props.onUserContextMenu}
                      />
                    )}
                  </For>
                </span>
              )}
            </Show>
          </>
        }
      >
        {(redemption) => (
          <>
            {chatterName(item.chatter_name)}
            {` ${t("EVENT_REDEEMED")} `}
            <RedemptionReward redemption={redemption()} />
            {time()}
            <Show when={redemption().input}>
              {(input) => <span class="block">{input()}</span>}
            </Show>
          </>
        )}
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
