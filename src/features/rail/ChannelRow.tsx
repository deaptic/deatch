import { Users } from "lucide-solid";
import { Show } from "solid-js";
import { channelInfoFor, streamForUserId } from "../channels/index.ts";
import { formatCount } from "../../shared/format/stream.ts";
import type { User } from "../../shared/types/index.ts";
import Avatar from "../../kit/Avatar.tsx";
import { avatarZoom } from "../../shared/avatar.ts";
import RailRow from "./RailRow.tsx";
import StreamTooltip from "./StreamTooltip.tsx";
import { TabMuteBadge } from "../link/index.ts";
import { t } from "../../shared/i18n/index.ts";
import * as browser from "../../platform/browser.ts";
import { hasUnread } from "../feed/index.ts";
import * as inbox from "../inbox/index.ts";
import { pendingChannel } from "../navigation/index.ts";
import Text from "../../kit/Text.tsx";

type Props = {
  ch: User;
  dimmed?: boolean;
  muted?: boolean;
  earnedAt?: string | null;
  ephemeral?: boolean;
  onToggleMute?: () => void;
  onSelect: (ch: User) => void;
  onMiddleClick?: () => void;
  onContextMenu: (x: number, y: number, ch: User) => void;
};

export default function ChannelRow(props: Props) {
  const stream = () => streamForUserId(props.ch.id);
  const info = () => channelInfoFor(props.ch.id);
  const game = () => stream()?.game.name || info()?.game.name;

  return (
    <RailRow
      label={props.ch.displayName}
      quiet={!stream()}
      sub={game()}
      trailing={
        <Show
          when={stream()}
          fallback={
            <Text size="sm" tone="faint" class="shrink-0">
              {t("RAIL_OFFLINE_STATUS")}
            </Text>
          }
        >
          {(s) => (
            <span class="shrink-0 flex items-center gap-1.5">
              <Text size="sm" tone="negative" class="flex">
                <Users class="size-3.5" />
              </Text>
              <Text size="sm" tone="soft" tabular>
                {formatCount(s().viewerCount)}
              </Text>
            </span>
          )}
        </Show>
      }
      card={() => (
        <StreamTooltip
          user={props.ch}
          stream={stream()}
          info={info()}
          earning={!!props.earnedAt}
        />
      )}
      selected={pendingChannel()?.id === props.ch.id}
      unread={hasUnread(props.ch.id)}
      count={inbox.unreadCountIn(props.ch.id)}
      dimmed={props.dimmed}
      onClick={() => props.onSelect(props.ch)}
      onMiddleClick={() =>
        props.onMiddleClick
          ? props.onMiddleClick()
          : browser.openChannel(props.ch.login)
      }
      onContextMenu={(x, y) => props.onContextMenu(x, y, props.ch)}
    >
      <Avatar
        src={props.ch.profileImageUrl}
        zoom={avatarZoom(props.ch.profileImageUrl)}
        alt={props.ch.displayName}
        size="md"
        square
        ring={
          props.earnedAt ? "accent" : props.ephemeral ? "dashed" : undefined
        }
        pulse={props.earnedAt ?? undefined}
        dimmed={!stream()}
      >
        <Show when={props.onToggleMute}>
          {(toggle) => (
            <TabMuteBadge muted={!!props.muted} onToggle={toggle()} />
          )}
        </Show>
      </Avatar>
    </RailRow>
  );
}
