import {
  ClipboardPaste,
  Copy,
  CornerUpLeft,
  Reply,
  Trash2,
} from "lucide-solid";
import { Show } from "solid-js";
import { deleteChatMessages } from "../../lib/api/twitch/moderation.ts";
import Menu from "../ui/Menu.tsx";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import CopyPayloadItem from "./CopyPayloadItem.tsx";
import type { FeedMessage } from "../../lib/types/index.ts";
import { textOf } from "../../lib/utils/message.ts";
import { copyField } from "../../lib/utils/clipboard.ts";

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
  onJumpToMessage: (messageId: string) => void;
};

export default function MessageContextMenu(props: Props) {
  const run = (action: () => unknown) => () => {
    action();
    props.onClose();
  };

  return (
    <Menu x={props.x} y={props.y} onClose={props.onClose}>
      <MenuItem
        label="Reply"
        icon={<Reply />}
        onClick={run(() => props.onReply(props.msg))}
      />
      <Show when={props.msg.reply}>
        {(reply) => (
          <MenuItem
            label="Jump to parent"
            icon={<CornerUpLeft />}
            onClick={run(() =>
              props.onJumpToMessage(reply().parent_message_id)
            )}
          />
        )}
      </Show>
      <MenuItem
        label="Copy text"
        icon={<Copy />}
        onClick={run(() => copyField(textOf(props.msg)))}
      />
      <Show when={props.showCopypasta}>
        <MenuItem
          label="Copypasta"
          icon={<ClipboardPaste />}
          onClick={run(() => props.onCopypasta(props.msg))}
        />
      </Show>
      <Show when={props.isMod}>
        <MenuDivider />
        <MenuItem
          label="Delete message"
          tone="negative"
          icon={<Trash2 />}
          onClick={run(() =>
            deleteChatMessages({
              broadcasterId: props.broadcasterId,
              messageId: props.msg.message_id,
            }).catch(() => {})
          )}
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
