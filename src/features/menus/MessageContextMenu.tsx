import {
  ClipboardPaste,
  Copy,
  CornerUpLeft,
  Pin,
  PinOff,
  Reply,
  Trash2,
} from "lucide-solid";
import { For, Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import { deleteChatMessages } from "../../platform/twitch/moderation.ts";
import Menu from "../../kit/Menu.tsx";
import MenuDivider from "../../kit/MenuDivider.tsx";
import MenuItem from "../../kit/MenuItem.tsx";
import SubMenu from "../../kit/SubMenu.tsx";
import { formatDuration } from "../../shared/format/duration.ts";
import { PIN_DURATIONS } from "../../shared/twitch.ts";
import CopyPayloadItem from "./CopyPayloadItem.tsx";
import type { FeedMessage } from "../feed/index.ts";
import { textOf } from "../feed/index.ts";
import * as clipboard from "../../kit/clipboard.ts";

type Props = {
  x: number;
  y: number;
  msg: FeedMessage;
  isMod: boolean;
  broadcasterId: string;
  developerMode: boolean;
  showCopypasta: boolean;
  pinned: boolean;
  onClose: () => void;
  onReply: (msg: FeedMessage) => void;
  onCopypasta: (msg: FeedMessage) => void;
  onJumpToMessage: (messageId: string) => void;
  onPin: (durationSeconds: number | null) => void;
  onUnpin: () => void;
};

export default function MessageContextMenu(props: Props) {
  return (
    <Menu x={props.x} y={props.y} onClose={props.onClose}>
      <MenuItem
        label={t("MENU_REPLY_LABEL")}
        icon={<Reply />}
        onClick={() => props.onReply(props.msg)}
      />
      <Show when={props.msg.reply}>
        {(reply) => (
          <MenuItem
            label={t("MENU_JUMP_TO_PARENT_LABEL")}
            icon={<CornerUpLeft />}
            onClick={() => props.onJumpToMessage(reply().parent_message_id)}
          />
        )}
      </Show>
      <MenuItem
        label={t("MENU_COPY_TEXT_LABEL")}
        icon={<Copy />}
        onClick={() => clipboard.copy(textOf(props.msg))}
      />
      <Show when={props.showCopypasta}>
        <MenuItem
          label={t("MENU_COPYPASTA_LABEL")}
          icon={<ClipboardPaste />}
          onClick={() => props.onCopypasta(props.msg)}
        />
      </Show>
      <Show when={props.isMod}>
        <MenuDivider />
        <Show
          when={!props.pinned}
          fallback={
            <MenuItem
              label={t("MENU_UNPIN_LABEL")}
              icon={<PinOff />}
              onClick={() => props.onUnpin()}
            />
          }
        >
          <SubMenu label={t("MENU_PIN_LABEL")} icon={<Pin />}>
            <MenuItem
              label={t("MENU_PIN_UNTIL_END_LABEL")}
              onClick={() => props.onPin(null)}
            />
            <For each={PIN_DURATIONS}>
              {(seconds) => (
                <MenuItem
                  label={formatDuration(seconds)}
                  onClick={() => props.onPin(seconds)}
                />
              )}
            </For>
          </SubMenu>
        </Show>
        <MenuItem
          label={t("MENU_DELETE_MESSAGE_LABEL")}
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
