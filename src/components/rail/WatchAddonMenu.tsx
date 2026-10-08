import { Puzzle } from "lucide-solid";
import { openUrl } from "@tauri-apps/plugin-opener";
import Menu from "../ui/Menu.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import { FIREFOX_ADDON_URL } from "../../lib/constants/links.ts";

type Props = {
  x: number;
  y: number;
  opener?: () => HTMLElement | undefined;
  onClose: () => void;
};

export default function WatchAddonMenu(props: Props) {
  return (
    <Menu x={props.x} y={props.y} opener={props.opener} onClose={props.onClose}>
      <MenuItem
        label="Firefox add-on"
        icon={<Puzzle />}
        hint="Get it"
        onClick={() => {
          void openUrl(FIREFOX_ADDON_URL);
          props.onClose();
        }}
      />
      <MenuItem
        label="Chrome extension"
        icon={<Puzzle />}
        hint="Coming soon"
        disabled
        onClick={() => {}}
      />
    </Menu>
  );
}
