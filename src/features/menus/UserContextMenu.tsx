import {
  AtSign,
  Ban,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Hash,
  Megaphone,
  ShieldAlert,
  TriangleAlert,
  User,
  UserCheck,
  UserX,
} from "lucide-solid";
import { Show } from "solid-js";
import * as browser from "../../platform/browser.ts";
import * as clipboard from "../../kit/clipboard.ts";
import { t } from "../../shared/i18n/index.ts";
import { sendShoutout } from "../../platform/twitch/chat.ts";
import { setSuspiciousStatus } from "../../platform/twitch/moderation.ts";
import type { SuspiciousStatus } from "../../shared/types/index.ts";
import Menu from "../../kit/Menu.tsx";
import * as blocks from "../blocks/index.ts";
import { user as currentUser } from "../users/index.ts";
import MenuDivider from "../../kit/MenuDivider.tsx";
import MenuItem from "../../kit/MenuItem.tsx";
import SubMenu from "../../kit/SubMenu.tsx";
import CopyPayloadItem from "./CopyPayloadItem.tsx";

type UserContextTarget = {
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
  const moderate = (action: ModAction) => () =>
    props.onModerate(action, {
      userId: props.userId,
      userName: props.userDisplayName,
    });

  const suspicious = (status: SuspiciousStatus) => () =>
    setSuspiciousStatus({
      broadcasterId: props.broadcasterId,
      userId: props.userId,
      status,
    }).catch(() => {});

  return (
    <Menu x={props.x} y={props.y} onClose={props.onClose}>
      <MenuItem
        label={t("MENU_PROFILE_LABEL")}
        icon={<User />}
        onClick={() => props.onShowProfile(props.x, props.y, props.userId)}
      />
      <MenuItem
        label={t("MENU_MENTION_LABEL")}
        icon={<AtSign />}
        onClick={() => props.onMention(props.userLogin)}
      />
      <MenuItem
        label={t("MENU_OPEN_IN_BROWSER_LABEL")}
        icon={<ExternalLink />}
        onClick={() => browser.openChannel(props.userLogin)}
      />
      <MenuDivider />
      <MenuItem
        label={t("MENU_COPY_LOGIN_LABEL")}
        icon={<Copy />}
        onClick={() => clipboard.copy(props.userLogin)}
      />
      <MenuItem
        label={t("MENU_COPY_USER_ID_LABEL")}
        icon={<Hash />}
        onClick={() => clipboard.copy(props.userId)}
      />
      <Show when={props.isMod}>
        <MenuDivider />
        <MenuItem
          label={t("MENU_SHOUTOUT_LABEL")}
          icon={<Megaphone />}
          onClick={() =>
            sendShoutout({
              fromBroadcasterId: props.broadcasterId,
              toBroadcasterId: props.userId,
            }).catch(() => {})
          }
        />
        <SubMenu label={t("SUSPICIOUS_MENU_LABEL")} icon={<ShieldAlert />}>
          <MenuItem
            label={t("SUSPICIOUS_MONITOR_LABEL")}
            icon={<Eye />}
            onClick={suspicious("active_monitoring")}
          />
          <MenuItem
            label={t("SUSPICIOUS_RESTRICT_LABEL")}
            icon={<EyeOff />}
            tone="caution"
            onClick={suspicious("restricted")}
          />
          <MenuItem
            label={t("SUSPICIOUS_CLEAR_LABEL")}
            icon={<UserCheck />}
            onClick={suspicious("none")}
          />
        </SubMenu>
        <MenuItem
          label={t("MENU_WARN_LABEL")}
          icon={<TriangleAlert />}
          tone="caution"
          onClick={moderate("warn")}
        />
        <MenuItem
          label={t("MENU_BAN_TIMEOUT_LABEL")}
          tone="negative"
          icon={<Ban />}
          onClick={moderate("ban")}
        />
      </Show>
      <Show when={props.userId !== currentUser()?.id}>
        <MenuDivider />
        <MenuItem
          label={t("MENU_BLOCK_LABEL")}
          icon={<UserX />}
          tone="negative"
          onClick={() =>
            blocks
              .block({
                id: props.userId,
                login: props.userLogin,
                displayName: props.userDisplayName,
              })
              .catch(() => {})
          }
        />
      </Show>
      <CopyPayloadItem
        show={props.developerMode}
        data={{
          userId: props.userId,
          userLogin: props.userLogin,
          userDisplayName: props.userDisplayName,
        }}
      />
    </Menu>
  );
}
