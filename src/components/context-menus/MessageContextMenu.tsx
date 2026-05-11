import { Show } from "solid-js";
import { sendShoutout } from "../../commands/chat";
import { deleteChatMessages } from "../../commands/moderation";
import ContextMenu from "../../ui/ContextMenu";
import ContextMenuItem from "../../ui/ContextMenuItem";
import ContextMenuDivider from "../../ui/ContextMenuDivider";
import ReplyIcon from "../../icons/ReplyIcon";
import CopyIcon from "../../icons/CopyIcon";
import ShoutoutIcon from "../../icons/ShoutoutIcon";
import TrashIcon from "../../icons/TrashIcon";
import BanIcon from "../../icons/BanIcon";
import TimeoutIcon from "../../icons/TimeoutIcon";
import { feedUserMuted, muteUser, unmuteUser } from "../../state/preferences";
import type { FeedMessage } from "../feed/types";

type Props = {
  x: number;
  y: number;
  msg: FeedMessage;
  isMod: boolean;
  broadcasterId: string;
  developerMode: boolean;
  onClose: () => void;
  onReply: (msg: FeedMessage) => void;
  onModAction: (action: "timeout" | "ban", msg: FeedMessage) => void;
};

export default function MessageContextMenu(props: Props) {
  const muted = () => feedUserMuted().includes(props.msg.chatter_user_id);

  return (
    <ContextMenu x={props.x} y={props.y} onClose={props.onClose}>
      <ContextMenuItem
        label="Reply"
        icon={<ReplyIcon class="w-3.5 h-3.5" />}
        onClick={() => { props.onReply(props.msg); props.onClose(); }}
      />
      <ContextMenuItem
        label="Copy Text"
        icon={<CopyIcon class="w-3.5 h-3.5" />}
        onClick={() => { navigator.clipboard.writeText(props.msg.fragments.map((f) => f.text).join("")); props.onClose(); }}
      />
      <ContextMenuDivider />
      <ContextMenuItem
        label={muted() ? `Unmute ${props.msg.chatter_name}` : `Mute ${props.msg.chatter_name}`}
        danger={!muted()}
        onClick={() => {
          const id = props.msg.chatter_user_id;
          if (muted()) unmuteUser(id);
          else muteUser(id);
          props.onClose();
        }}
      />
      <Show when={props.isMod}>
        <ContextMenuDivider />
        <ContextMenuItem
          label="Shoutout"
          icon={<ShoutoutIcon class="w-3.5 h-3.5" />}
          onClick={() => { sendShoutout({ fromBroadcasterId: props.broadcasterId, toBroadcasterId: props.msg.chatter_user_id }); props.onClose(); }}
        />
        <ContextMenuItem
          label={`Timeout ${props.msg.chatter_name}`}
          danger
          icon={<TimeoutIcon class="w-3.5 h-3.5" />}
          onClick={() => { props.onModAction("timeout", props.msg); props.onClose(); }}
        />
        <ContextMenuItem
          label={`Ban ${props.msg.chatter_name}`}
          danger
          icon={<BanIcon class="w-3.5 h-3.5" />}
          onClick={() => { props.onModAction("ban", props.msg); props.onClose(); }}
        />
        <ContextMenuDivider />
        <ContextMenuItem
          label="Delete Message"
          danger
          icon={<TrashIcon class="w-3.5 h-3.5" />}
          onClick={() => { deleteChatMessages({ broadcasterId: props.broadcasterId, messageId: props.msg.message_id }); props.onClose(); }}
        />
      </Show>
      <Show when={props.developerMode}>
        <ContextMenuDivider />
        <ContextMenuItem
          label="Copy Payload"
          icon={<CopyIcon class="w-3.5 h-3.5" />}
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(props.msg, null, 2));
            props.onClose();
          }}
        />
      </Show>
    </ContextMenu>
  );
}
