import { ClipboardPaste, Copy, Reply, Trash2 } from "lucide-solid";
import { Show } from "solid-js";
import { deleteChatMessages } from "../../lib/api/twitch/moderation.ts";
import ContextMenu from "../ui/ContextMenu.tsx";
import ContextMenuItem from "../ui/ContextMenuItem.tsx";
import ContextMenuDivider from "../ui/ContextMenuDivider.tsx";
import CopyPayloadItem from "./CopyPayloadItem.tsx";
import type { FeedMessage } from "../../lib/types/index.ts";

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
        icon={<Reply class="w-3.5 h-3.5" />}
        onClick={() => { props.onReply(props.msg); props.onClose(); }}
      />
      <ContextMenuItem
        label="Copy Text"
        icon={<Copy class="w-3.5 h-3.5" />}
        onClick={() => { navigator.clipboard.writeText(props.msg.fragments.map((f) => f.text).join("")); props.onClose(); }}
      />
      <Show when={props.showCopypasta}>
        <ContextMenuDivider />
        <ContextMenuItem
          label="Copypasta"
          icon={<ClipboardPaste class="w-3.5 h-3.5" />}
          onClick={() => { props.onCopypasta(props.msg); props.onClose(); }}
        />
      </Show>
      <Show when={props.isMod}>
        <ContextMenuDivider />
        <ContextMenuItem
          label="Delete Message"
          danger
          icon={<Trash2 class="w-3.5 h-3.5" />}
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
