import { Show } from "solid-js";
import ContextMenu from "../../ui/ContextMenu";
import ContextMenuItem from "../../ui/ContextMenuItem";
import ContextMenuDivider from "../../ui/ContextMenuDivider";
import CopyIcon from "../../icons/CopyIcon";
import type { FeedEvent } from "./types";

type Props = {
  x: number;
  y: number;
  item: FeedEvent;
  developerMode: boolean;
  onClose: () => void;
};

export default function EventContextMenu(props: Props) {
  return (
    <ContextMenu x={props.x} y={props.y} onClose={props.onClose}>
      <ContextMenuItem
        label="Copy Text"
        icon={<CopyIcon class="w-3.5 h-3.5" />}
        onClick={() => {
          navigator.clipboard.writeText(props.item.system_message);
          props.onClose();
        }}
      />
      <Show when={props.developerMode}>
        <ContextMenuDivider />
        <ContextMenuItem
          label="Copy Payload"
          icon={<CopyIcon class="w-3.5 h-3.5" />}
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(props.item, null, 2));
            props.onClose();
          }}
        />
      </Show>
    </ContextMenu>
  );
}
