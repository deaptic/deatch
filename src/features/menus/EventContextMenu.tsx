import { Copy } from "lucide-solid";
import { t } from "../../shared/i18n/index.ts";
import Menu from "../../kit/Menu.tsx";
import MenuItem from "../../kit/MenuItem.tsx";
import * as clipboard from "../../kit/clipboard.ts";
import CopyPayloadItem from "./CopyPayloadItem.tsx";
import { eventText, type FeedEvent } from "../feed/index.ts";

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
        label={t("MENU_COPY_TEXT_LABEL")}
        icon={<Copy />}
        onClick={() => clipboard.copy(eventText(props.item))}
      />
      <CopyPayloadItem show={props.developerMode} data={props.item} />
    </Menu>
  );
}
