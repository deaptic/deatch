import { Show } from "solid-js";
import { sendShoutout } from "../../lib/api/twitch/chat";
import ContextMenu from "../ui/ContextMenu";
import ContextMenuItem from "../ui/ContextMenuItem";
import ContextMenuDivider from "../ui/ContextMenuDivider";
import MegaphoneIcon from "../icons/MegaphoneIcon";
import BanIcon from "../icons/BanIcon";
import HashIcon from "../icons/HashIcon";
import MuteIcon from "../icons/MuteIcon";
import UserIcon from "../icons/UserIcon";
import AtIcon from "../icons/AtIcon";
import CopyPayloadItem from "./CopyPayloadItem";
import {
  feedUserMuted,
  feedUserNickname,
  muteUser,
  unmuteUser,
} from "../../lib/stores/preferences";

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
  onEditNickname: (login: string, displayName: string, x: number, y: number) => void;
  onShowProfile: (x: number, y: number, userId: string) => void;
  onMention: (login: string) => void;
};

export default function UserContextMenu(props: Props) {
  const muted = () => feedUserMuted().includes(props.userId);
  const nickname = () => feedUserNickname(props.userLogin);

  return (
    <ContextMenu x={props.x} y={props.y} onClose={props.onClose}>
      <ContextMenuItem
        label="Profile"
        icon={<UserIcon class="w-3.5 h-3.5" />}
        onClick={() => { props.onShowProfile(props.x, props.y, props.userId); props.onClose(); }}
      />
      <ContextMenuItem
        label="Mention"
        icon={<AtIcon class="w-3.5 h-3.5" />}
        onClick={() => { props.onMention(props.userLogin); props.onClose(); }}
      />
      <Show when={props.isMod}>
        <ContextMenuItem
          label="Shoutout"
          icon={<MegaphoneIcon class="w-3.5 h-3.5" />}
          onClick={() => {
            sendShoutout({ fromBroadcasterId: props.broadcasterId, toBroadcasterId: props.userId });
            props.onClose();
          }}
        />
      </Show>
      <ContextMenuDivider />
      <ContextMenuItem
        label={nickname() ? "Edit nickname" : "Set nickname"}
        icon={<HashIcon class="w-3.5 h-3.5" />}
        onClick={() => {
          props.onEditNickname(props.userLogin, props.userDisplayName, props.x, props.y);
          props.onClose();
        }}
      />
      <ContextMenuItem
        label={muted() ? `Unmute ${props.userDisplayName}` : `Mute ${props.userDisplayName}`}
        danger={!muted()}
        icon={<MuteIcon class="w-3.5 h-3.5" />}
        onClick={() => {
          if (muted()) unmuteUser(props.userId);
          else muteUser(props.userId);
          props.onClose();
        }}
      />
      <Show when={props.isMod}>
        <ContextMenuDivider />
        <ContextMenuItem
          label="Ban / Timeout"
          danger
          icon={<BanIcon class="w-3.5 h-3.5" />}
          onClick={() => {
            props.onModerate({ userId: props.userId, userName: props.userDisplayName });
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
    </ContextMenu>
  );
}
