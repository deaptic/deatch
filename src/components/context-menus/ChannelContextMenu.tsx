import { LogOut } from "lucide-solid";
import { Show } from "solid-js";
import Menu from "../ui/Menu.tsx";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import CopyPayloadItem from "./CopyPayloadItem.tsx";
import type { User } from "../../lib/types/index.ts";

type Props = {
  x: number;
  y: number;
  align?: "start" | "center" | "end";
  ch: User;
  isPinned: boolean;
  developerMode: boolean;
  onClose: () => void;
  onOpenInBrowser: (ch: User) => void;
  onPin?: (ch: User) => void;
  onUnpin: (userId: string) => void;
  onRaid?: (ch: User) => void;
  onLogout?: () => void;
};

export default function ChannelContextMenu(props: Props) {
  return (
    <Menu x={props.x} y={props.y} align={props.align} onClose={props.onClose}>
      <MenuItem
        label="Open in browser"
        onClick={() => {
          props.onOpenInBrowser(props.ch);
          props.onClose();
        }}
      />
      <Show
        when={props.isPinned}
        fallback={
          <Show when={props.onPin}>
            <MenuItem
              label="Pin"
              onClick={() => {
                props.onPin?.(props.ch);
                props.onClose();
              }}
            />
          </Show>
        }
      >
        <MenuItem
          label="Unpin"
          onClick={() => {
            props.onUnpin(props.ch.id);
            props.onClose();
          }}
        />
      </Show>
      <Show when={props.onRaid}>
        <MenuDivider />
        <MenuItem
          label="Raid"
          onClick={() => {
            props.onRaid?.(props.ch);
            props.onClose();
          }}
        />
      </Show>
      <CopyPayloadItem
        show={props.developerMode}
        data={props.ch}
        onClose={props.onClose}
      />
      <Show when={props.onLogout}>
        <MenuDivider />
        <MenuItem
          label="Log out"
          icon={<LogOut />}
          danger
          onClick={() => {
            props.onLogout?.();
            props.onClose();
          }}
        />
      </Show>
    </Menu>
  );
}
