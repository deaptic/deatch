import { Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import ContextMenu from "../ui/ContextMenu";
import ContextMenuItem from "../ui/ContextMenuItem";
import ContextMenuDivider from "../ui/ContextMenuDivider";
import ReplyIcon from "../icons/ReplyIcon";
import CopyIcon from "../icons/CopyIcon";
import ShoutoutIcon from "../icons/ShoutoutIcon";
import TrashIcon from "../icons/TrashIcon";
import BanIcon from "../icons/BanIcon";
import TimeoutIcon from "../icons/TimeoutIcon";
import { contextMenu, closeContextMenu, openModAction, startReply } from "../chat-state";
import { developerMode, mutedUsers, setMutedUsers } from "../feed-prefs";

type Props = {
  isMod: boolean;
  broadcasterId: string;
};

export default function ChatMessageContextMenu(props: Props) {
  const cm = () => contextMenu()!;
  return (
    <ContextMenu x={cm().x} y={cm().y} onClose={closeContextMenu}>
      <ContextMenuItem
        label="Reply"
        icon={<ReplyIcon class="w-3.5 h-3.5" />}
        onClick={() => { startReply(cm().msg); closeContextMenu(); }}
      />
      <ContextMenuItem
        label="Copy Text"
        icon={<CopyIcon class="w-3.5 h-3.5" />}
        onClick={() => { navigator.clipboard.writeText(cm().msg.fragments.map((f) => f.text).join("")); closeContextMenu(); }}
      />
      {(() => {
        const login = cm().msg.chatter_login.toLowerCase();
        const muted = mutedUsers().includes(login);
        return (
          <ContextMenuItem
            label={muted ? `Unmute ${cm().msg.chatter_name}` : `Mute ${cm().msg.chatter_name}`}
            danger={!muted}
            onClick={() => {
              if (muted) setMutedUsers(mutedUsers().filter((n) => n !== login));
              else setMutedUsers([...mutedUsers(), login]);
              closeContextMenu();
            }}
          />
        );
      })()}
      <Show when={props.isMod}>
        <ContextMenuDivider />
        <ContextMenuItem
          label="Shoutout"
          icon={<ShoutoutIcon class="w-3.5 h-3.5" />}
          onClick={() => { invoke("send_shoutout", { fromBroadcasterId: props.broadcasterId, toBroadcasterId: cm().msg.chatter_user_id }); closeContextMenu(); }}
        />
        <ContextMenuItem
          label={`Timeout ${cm().msg.chatter_name}`}
          danger
          icon={<TimeoutIcon class="w-3.5 h-3.5" />}
          onClick={() => { openModAction("timeout", cm().msg); closeContextMenu(); }}
        />
        <ContextMenuItem
          label={`Ban ${cm().msg.chatter_name}`}
          danger
          icon={<BanIcon class="w-3.5 h-3.5" />}
          onClick={() => { openModAction("ban", cm().msg); closeContextMenu(); }}
        />
        <ContextMenuDivider />
        <ContextMenuItem
          label="Delete Message"
          danger
          icon={<TrashIcon class="w-3.5 h-3.5" />}
          onClick={() => { invoke("delete_chat_messages", { broadcasterId: props.broadcasterId, messageId: cm().msg.message_id }); closeContextMenu(); }}
        />
      </Show>
      <Show when={developerMode()}>
        <ContextMenuDivider />
        <ContextMenuItem
          label="Copy Payload"
          icon={<CopyIcon class="w-3.5 h-3.5" />}
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(cm().msg, null, 2));
            closeContextMenu();
          }}
        />
      </Show>
    </ContextMenu>
  );
}
