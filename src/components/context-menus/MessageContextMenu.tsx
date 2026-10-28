import {
  ClipboardPaste,
  Copy,
  CornerUpLeft,
  Reply,
  Trash2,
} from "lucide-solid";
import { Show } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import { deleteChatMessages } from "../../lib/api/twitch/moderation.ts";
import Menu from "../ui/Menu.tsx";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import CopyPayloadItem from "./CopyPayloadItem.tsx";
import type { FeedMessage } from "../../lib/types/index.ts";
import { textOf } from "../../lib/utils/message.ts";
import * as clipboard from "../../lib/services/clipboard.ts";

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
  return (
    <Menu x={props.x} y={props.y} onClose={props.onClose}>
      <MenuItem
        label={t("MENU_REPLY")}
        icon={<Reply />}
        onClick={() => props.onReply(props.msg)}
      />
      <Show when={props.msg.reply}>
        {(reply) => (
          <MenuItem
            label={t("MENU_JUMP_TO_PARENT")}
            icon={<CornerUpLeft />}
            onClick={() => props.onJumpToMessage(reply().parent_message_id)}
          />
        )}
      </Show>
      <MenuItem
        label={t("MENU_COPY_TEXT")}
        icon={<Copy />}
        onClick={() => clipboard.copy(textOf(props.msg))}
      />
      <Show when={props.showCopypasta}>
        <MenuItem
          label={t("MENU_COPYPASTA")}
          icon={<ClipboardPaste />}
          onClick={() => props.onCopypasta(props.msg)}
        />
      </Show>
      <Show when={props.isMod}>
        <MenuDivider />
        <MenuItem
          label={t("MENU_DELETE_MESSAGE")}
          tone="negative"
          icon={<Trash2 />}
          onClick={() =>
            deleteChatMessages({
              broadcasterId: props.broadcasterId,
              messageId: props.msg.message_id,
            }).catch(() => {})
          }
        />
      </Show>
      <CopyPayloadItem show={props.developerMode} data={props.msg} />
    </Menu>
  );
}
