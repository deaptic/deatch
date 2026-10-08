import { AtSign, Ban, Megaphone, User } from "lucide-solid";
import { Show } from "solid-js";
import { sendShoutout } from "../../lib/api/twitch/chat.ts";
import Menu from "../ui/Menu.tsx";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import CopyPayloadItem from "./CopyPayloadItem.tsx";

export type UserContextTarget = {
  userId: string;
  userLogin: string;
  userDisplayName: string;
};

type Props = UserContextTarget & {
  x: number;
  y: number;
  isMod: boolean;
  broadcasterId: string;
  developerMode: boolean;
  onClose: () => void;
  onModerate: (target: { userId: string; userName: string }) => void;
  onShowProfile: (x: number, y: number, userId: string) => void;
  onMention: (login: string) => void;
};

export default function UserContextMenu(props: Props) {
  return (
    <Menu x={props.x} y={props.y} onClose={props.onClose}>
      <MenuItem
        label="Profile"
        icon={<User />}
        onClick={() => {
          props.onShowProfile(props.x, props.y, props.userId);
          props.onClose();
        }}
      />
      <MenuItem
        label="Mention"
        icon={<AtSign />}
        onClick={() => {
          props.onMention(props.userLogin);
          props.onClose();
        }}
      />
      <Show when={props.isMod}>
        <MenuItem
          label="Shoutout"
          icon={<Megaphone />}
          onClick={() => {
            sendShoutout({
              fromBroadcasterId: props.broadcasterId,
              toBroadcasterId: props.userId,
            }).catch(() => {});
            props.onClose();
          }}
        />
      </Show>
      <Show when={props.isMod}>
        <MenuDivider />
        <MenuItem
          label="Ban / Timeout"
          danger
          icon={<Ban />}
          onClick={() => {
            props.onModerate({
              userId: props.userId,
              userName: props.userDisplayName,
            });
            props.onClose();
          }}
        />
      </Show>
      <CopyPayloadItem
        show={props.developerMode}
        data={{
          userId: props.userId,
          userLogin: props.userLogin,
          userDisplayName: props.userDisplayName,
        }}
        onClose={props.onClose}
      />
    </Menu>
  );
}
