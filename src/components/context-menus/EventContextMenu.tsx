import { Copy } from "lucide-solid";
import ContextMenu from "../ui/ContextMenu.tsx";
import ContextMenuItem from "../ui/ContextMenuItem.tsx";
import CopyPayloadItem from "./CopyPayloadItem.tsx";
import type { FeedEvent } from "../../lib/types/index.ts";

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
        icon={<Copy class="w-3.5 h-3.5" />}
        onClick={() => {
          navigator.clipboard.writeText(props.item.system_message);
          props.onClose();
        }}
      />
      <CopyPayloadItem
        show={props.developerMode}
        data={props.item}
        onClose={props.onClose}
      />
    </ContextMenu>
  );
}
