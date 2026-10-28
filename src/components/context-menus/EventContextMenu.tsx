import { Copy } from "lucide-solid";
import { t } from "../../lib/i18n/index.ts";
import Menu from "../ui/Menu.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import * as clipboard from "../../lib/services/clipboard.ts";
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
        label={t("MENU_COPY_TEXT")}
        icon={<Copy />}
        onClick={() => clipboard.copy(props.item.system_message)}
      />
      <CopyPayloadItem show={props.developerMode} data={props.item} />
    </Menu>
  );
}
