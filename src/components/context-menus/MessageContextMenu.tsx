import { ClipboardPaste, Copy, Reply, Trash2 } from "lucide-solid";
import { Show } from "solid-js";
import { deleteChatMessages } from "../../lib/api/twitch/moderation.ts";
import Menu from "../ui/Menu.tsx";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";
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
    <Menu x={props.x} y={props.y} onClose={props.onClose}>
      <MenuItem
        label="Reply"
        icon={<Reply />}
        onClick={() => {
          props.onReply(props.msg);
          props.onClose();
        }}
      />
      <MenuItem
        label="Copy Text"
        icon={<Copy />}
        onClick={() => {
          navigator.clipboard.writeText(
            props.msg.fragments.map((f) => f.text).join(""),
          );
          props.onClose();
        }}
      />
      <Show when={props.showCopypasta}>
        <MenuDivider />
        <MenuItem
          label="Copypasta"
          icon={<ClipboardPaste />}
          onClick={() => {
            props.onCopypasta(props.msg);
            props.onClose();
          }}
        />
      </Show>
      <Show when={props.isMod}>
        <MenuDivider />
        <MenuItem
          label="Delete Message"
          danger
          icon={<Trash2 />}
          onClick={() => {
            deleteChatMessages({
              broadcasterId: props.broadcasterId,
              messageId: props.msg.message_id,
            });
            props.onClose();
          }}
        />
      </Show>
      <CopyPayloadItem
        show={props.developerMode}
        data={props.msg}
        onClose={props.onClose}
      />
    </Menu>
  );
}
