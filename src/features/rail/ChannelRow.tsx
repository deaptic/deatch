import { Show } from "solid-js";
import { channelInfoFor, streamForUserId } from "../channels/index.ts";
import { formatViewers } from "../../shared/format/stream.ts";
import type { User } from "../../lib/types/index.ts";
import Avatar from "../../kit/Avatar.tsx";
import RailRow from "./RailRow.tsx";
import StreamTooltip from "./StreamTooltip.tsx";
import { TabMuteBadge } from "../link/index.ts";
import { t } from "../../shared/i18n/index.ts";
import * as browser from "../../lib/services/browser.ts";
import { hasUnread } from "../../lib/stores/feeds.ts";
import * as inbox from "../inbox/index.ts";
import { pendingChannel } from "../../lib/stores/view.ts";

type Props = {
  ch: User;
  dimmed?: boolean;
  muted?: boolean;
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
            <span class="shrink-0 text-small text-ink-faint">
              {t("RAIL_OFFLINE_STATUS")}
            </span>
          }
        >
          {(s) => (
            <span class="shrink-0 flex items-center gap-1.5 text-small tabular-nums text-ink-soft">
              <span class="size-1.5 rounded-full bg-live" />
              {formatViewers(s().viewerCount)}
            </span>
          )}
        </Show>
      }
      card={() => (
        <StreamTooltip user={props.ch} stream={stream()} info={info()} />
      )}
      selected={pendingChannel()?.id === props.ch.id}
      unread={hasUnread(props.ch.id)}
      mentions={inbox.unreadCountIn(props.ch.id)}
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
        alt={props.ch.displayName}
        size={40}
        square
        presence={stream() ? "live" : "offline"}
        dashed={props.ephemeral}
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
