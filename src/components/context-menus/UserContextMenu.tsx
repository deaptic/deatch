import {
  AtSign,
  Ban,
  ExternalLink,
  Megaphone,
  TriangleAlert,
  User,
} from "lucide-solid";
import { Show } from "solid-js";
import { openUrl } from "@tauri-apps/plugin-opener";
import { channelUrl } from "../../lib/utils/twitchUrl.ts";
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

export type ModAction = "ban" | "warn";

type Props = UserContextTarget & {
  x: number;
  y: number;
  isMod: boolean;
  broadcasterId: string;
  developerMode: boolean;
  onClose: () => void;
  onModerate: (
    action: ModAction,
    target: { userId: string; userName: string },
  ) => void;
  onShowProfile: (x: number, y: number, userId: string) => void;
  onMention: (login: string) => void;
};

export default function UserContextMenu(props: Props) {
  const run = (action: () => unknown) => () => {
    action();
    props.onClose();
  };
  const moderate = (action: ModAction) =>
    run(() =>
      props.onModerate(action, {
        userId: props.userId,
        userName: props.userDisplayName,
      })
    );

  return (
    <Menu x={props.x} y={props.y} onClose={props.onClose}>
      <MenuItem
        label="Profile"
        icon={<User />}
        onClick={run(() => props.onShowProfile(props.x, props.y, props.userId))}
      />
      <MenuItem
        label="Mention"
        icon={<AtSign />}
        onClick={run(() => props.onMention(props.userLogin))}
      />
      <MenuItem
        label="Open in browser"
        icon={<ExternalLink />}
        onClick={run(() => openUrl(channelUrl(props.userLogin)))}
      />
      <Show when={props.isMod}>
        <MenuDivider />
        <MenuItem
          label="Shoutout"
          icon={<Megaphone />}
          onClick={run(() =>
            sendShoutout({
              fromBroadcasterId: props.broadcasterId,
              toBroadcasterId: props.userId,
            }).catch(() => {})
          )}
        />
        <MenuItem
          label="Warn"
          icon={<TriangleAlert />}
          tone="caution"
          onClick={moderate("warn")}
        />
        <MenuItem
          label="Ban / Timeout"
          tone="negative"
          icon={<Ban />}
          onClick={moderate("ban")}
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
