import { Show } from "solid-js";
import { sendShoutout } from "../../commands/chat";
import ContextMenu from "../../ui/ContextMenu";
import ContextMenuItem from "../../ui/ContextMenuItem";
import ContextMenuDivider from "../../ui/ContextMenuDivider";
import ShoutoutIcon from "../../icons/ShoutoutIcon";
import BanIcon from "../../icons/BanIcon";
import TimeoutIcon from "../../icons/TimeoutIcon";
import HashIcon from "../../icons/HashIcon";
import MuteIcon from "../../icons/MuteIcon";
import UserIcon from "../../icons/UserIcon";
import AtIcon from "../../icons/AtIcon";
import CopyIcon from "../../icons/CopyIcon";
import {
  feedUserMuted,
  feedUserNickname,
  muteUser,
  unmuteUser,
} from "../../state/preferences";

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
  onModAction: (action: "timeout" | "ban", target: { userId: string; userName: string }) => void;
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
      <ContextMenuDivider />
      <ContextMenuItem
        label={nickname() ? "Edit nickname" : "Set nickname"}
        icon={<HashIcon class="w-3.5 h-3.5" />}
        onClick={() => {
          props.onEditNickname(props.userLogin, props.userDisplayName, props.x, props.y);
          props.onClose();
        }}
      />
      <Show when={props.isMod}>
        <ContextMenuItem
          label="Shoutout"
          icon={<ShoutoutIcon class="w-3.5 h-3.5" />}
          onClick={() => {
            sendShoutout({ fromBroadcasterId: props.broadcasterId, toBroadcasterId: props.userId });
            props.onClose();
          }}
        />
      </Show>
      <ContextMenuDivider />
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
        <ContextMenuItem
          label={`Timeout ${props.userDisplayName}`}
          danger
          icon={<TimeoutIcon class="w-3.5 h-3.5" />}
          onClick={() => {
            props.onModAction("timeout", { userId: props.userId, userName: props.userDisplayName });
            props.onClose();
          }}
        />
        <ContextMenuItem
          label={`Ban ${props.userDisplayName}`}
          danger
          icon={<BanIcon class="w-3.5 h-3.5" />}
          onClick={() => {
            props.onModAction("ban", { userId: props.userId, userName: props.userDisplayName });
            props.onClose();
          }}
        />
      </Show>
      <Show when={props.developerMode}>
        <ContextMenuDivider />
        <ContextMenuItem
          label="Copy Payload"
          icon={<CopyIcon class="w-3.5 h-3.5" />}
          onClick={() => {
            navigator.clipboard.writeText(
              JSON.stringify(
                { userId: props.userId, userLogin: props.userLogin, userDisplayName: props.userDisplayName },
                null,
                2,
              ),
            );
            props.onClose();
          }}
        />
      </Show>
    </ContextMenu>
  );
}
