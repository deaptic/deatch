import { Show } from "solid-js";
import { deleteChatMessages } from "../../lib/api/twitch/moderation";
import ContextMenu from "../ui/ContextMenu";
import ContextMenuItem from "../ui/ContextMenuItem";
import ContextMenuDivider from "../ui/ContextMenuDivider";
import ReplyIcon from "../icons/ReplyIcon";
import CopyIcon from "../icons/CopyIcon";
import PastaIcon from "../icons/PastaIcon";
import TrashIcon from "../icons/TrashIcon";
import CopyPayloadItem from "./CopyPayloadItem";
import type { FeedMessage } from "../../lib/types";

type Props = {
  x: number;
  y: number;
  msg: FeedMessage;
  isMod: boolean;
  broadcasterId: string;
  developerMode: boolean;
  showCopypasta: boolean;
  onClose: () => void;
  onReply: (msg: FeedMessage) => void;
  onCopypasta: (msg: FeedMessage) => void;
};

export default function MessageContextMenu(props: Props) {
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
      <Show when={props.showCopypasta}>
        <ContextMenuDivider />
        <ContextMenuItem
          label="Copypasta"
          icon={<PastaIcon class="w-3.5 h-3.5" />}
          onClick={() => { props.onCopypasta(props.msg); props.onClose(); }}
        />
      </Show>
      <Show when={props.isMod}>
        <ContextMenuDivider />
        <ContextMenuItem
          label="Delete Message"
          danger
          icon={<TrashIcon class="w-3.5 h-3.5" />}
          onClick={() => { deleteChatMessages({ broadcasterId: props.broadcasterId, messageId: props.msg.message_id }); props.onClose(); }}
        />
      </Show>
      <CopyPayloadItem
        show={props.developerMode}
        data={props.msg}
        onClose={props.onClose}
      />
    </ContextMenu>
  );
}
