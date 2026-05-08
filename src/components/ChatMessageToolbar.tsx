import { For } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import type { ChatMsg } from "./ChatMessage";
import Toolbar from "../ui/Toolbar";
import ToolbarItem from "../ui/ToolbarItem";
import ReplyIcon from "../icons/ReplyIcon";
import DotsIcon from "../icons/DotsIcon";
import { openContextMenu, startReply } from "../chat-state";
import { favorites } from "../emotes";

type Props = {
  item: ChatMsg;
  broadcasterId: string;
};

export default function ChatMessageToolbar(props: Props) {
  const react = (text: string) =>
    invoke("send_chat_message", {
      broadcasterId: props.broadcasterId,
      message: text,
      replyParentMessageId: props.item.message_id,
    });
  const reactions = () => favorites().slice(0, 3);
  return (
    <Toolbar>
      <For each={reactions()}>
        {(r) => (
          <ToolbarItem title={r.label} onClick={() => react(r.value)}>
            <img src={r.url} alt={r.label} class="w-5 h-5 object-contain" />
          </ToolbarItem>
        )}
      </For>
      <ToolbarItem title="Reply" onClick={() => startReply(props.item)}>
        <ReplyIcon class="w-3.5 h-3.5" />
      </ToolbarItem>
      <ToolbarItem
        title="More options"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          openContextMenu(rect.left, rect.bottom + 4, props.item);
        }}
      >
        <DotsIcon class="w-3.5 h-3.5" />
      </ToolbarItem>
    </Toolbar>
  );
}
