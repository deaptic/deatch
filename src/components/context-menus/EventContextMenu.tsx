import { Copy } from "lucide-solid";
import Menu from "../ui/Menu.tsx";
import MenuItem from "../ui/MenuItem.tsx";
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
    <Menu x={props.x} y={props.y} onClose={props.onClose}>
      <MenuItem
        label="Copy Text"
        icon={<Copy />}
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
    </Menu>
  );
}
