import { Show } from "solid-js";
import { channelInfoFor, streamForUserId } from "../../lib/stores/channels.ts";
import { formatViewers } from "../../lib/format/stream.ts";
import type { User } from "../../lib/types/index.ts";
import Avatar from "../ui/Avatar.tsx";
import RailRow from "./RailRow.tsx";
import StreamTooltip from "./StreamTooltip.tsx";
import TabMuteBadge from "./TabMuteBadge.tsx";
import { t } from "../../lib/i18n/index.ts";

type Props = {
  ch: User;
  selected: boolean;
  unread?: boolean;
  mentions?: number;
  dimmed?: boolean;
  muted?: boolean;
  ephemeral?: boolean;
  onToggleMute?: () => void;
  onSelect: () => void;
  onMiddleClick: () => void;
  onContextMenu: (x: number, y: number) => void;
};

export default function ChannelRow(props: Props) {
  const stream = () => streamForUserId(props.ch.id);
  const info = () => channelInfoFor(props.ch.id);
  const sub = () => {
    const s = stream();
    if (s) {
      return `${s.game.name || t("COMMON_LIVE")} · ${
        formatViewers(s.viewerCount)
      }`;
    }
    return info()?.game.name || t("COMMON_OFFLINE");
  };

  return (
    <RailRow
      label={props.ch.displayName}
      sub={sub()}
      subTone={stream() ? "live" : "soft"}
      tooltip={
        <StreamTooltip user={props.ch} stream={stream()} info={info()} />
      }
      selected={props.selected}
      unread={props.unread}
      mentions={props.mentions}
      dimmed={props.dimmed}
      onClick={props.onSelect}
      onMiddleClick={props.onMiddleClick}
      onContextMenu={props.onContextMenu}
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
