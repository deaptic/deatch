import {
  ArrowDown,
  ArrowUp,
  CheckCheck,
  ExternalLink,
  Link2,
  LogOut,
  Megaphone,
  MessageSquare,
  Pin,
  PinOff,
  Radio,
  Volume2,
  VolumeX,
  X,
} from "lucide-solid";
import { Show } from "solid-js";
import * as browser from "../../platform/browser.ts";
import { t } from "../../shared/i18n/index.ts";
import Menu from "../../kit/Menu.tsx";
import MenuDivider from "../../kit/MenuDivider.tsx";
import MenuItem from "../../kit/MenuItem.tsx";
import CopyPayloadItem from "./CopyPayloadItem.tsx";
import { TabVolume } from "../link/index.ts";
import { developerMode, pinnedChannels } from "../preferences/index.ts";
import * as link from "../link/index.ts";
import { pins } from "../rail/index.ts";
import { hasUnread } from "../feed/index.ts";
import * as inbox from "../inbox/index.ts";
import { user } from "../users/index.ts";
import { selectedChannel } from "../navigation/index.ts";
import { raid } from "../activity/index.ts";
import { hasPermission } from "../permissions/index.ts";
import { sendShoutout } from "../../platform/twitch/chat.ts";
import * as shortcuts from "../../shared/keyboard/shortcuts.ts";
import * as clipboard from "../../kit/clipboard.ts";
import { channelUrl } from "../../shared/twitchUrl.ts";
import type { User } from "../../shared/types/index.ts";

type Props = {
  x: number;
  y: number;
  align?: "start" | "center" | "end";
  ch: User;
  onClose: () => void;
} & (
  | { place: "rail"; onLogout?: () => void }
  | { place: "link"; onOpen?: () => void }
);

export default function ChannelContextMenu(props: Props) {
  const url = () => channelUrl(props.ch.login);
  const hasTab = () => link.tabs().some((c) => c.id === props.ch.id);
  const muted = () => link.mutedByLogin()[props.ch.login] === true;
  const pinned = () => pinnedChannels().includes(props.ch.id);
  const selected = () => selectedChannel()?.id === props.ch.id;
  const pinIndex = () => pinnedChannels().indexOf(props.ch.id);
  const movePin = (by: number) => () => pins.move(pinIndex(), pinIndex() + by);
  const movable = () => props.place === "rail" && !hasTab();
  const unread = () =>
    hasUnread(props.ch.id) || inbox.unreadCountIn(props.ch.id) > 0;
  const self = () => user();
  const other = () => self() && props.ch.id !== self()?.id;
  const shoutoutFrom = () => {
    const from = selectedChannel();
    return from && from.id !== props.ch.id && hasPermission(from.id, "moderate")
      ? from
      : null;
  };

  return (
    <Menu x={props.x} y={props.y} align={props.align} onClose={props.onClose}>
      <Show when={props.place === "link" && props.onOpen}>
        {(open) => (
          <>
            <MenuItem
              label={t("MENU_OPEN_CHAT_LABEL")}
              icon={<MessageSquare />}
              onClick={open()}
            />
            <MenuDivider />
          </>
        )}
      </Show>
      <Show when={props.place === "rail"}>
        <MenuItem
          label={t("MENU_MARK_AS_READ_LABEL")}
          icon={<CheckCheck />}
          disabled={!unread()}
          onClick={() => {
            inbox.markChannelSeen(props.ch.id);
          }}
        />
        <MenuDivider />
      </Show>
      <Show
        when={props.place === "rail" && hasTab()}
        fallback={
          <MenuItem
            label={t("MENU_OPEN_IN_BROWSER_LABEL")}
            icon={<ExternalLink />}
            shortcut={
              selected() ? shortcuts.keyFor("link::openTab") : undefined
            }
            onClick={() => browser.open(url())}
          />
        }
      >
        <MenuItem
          label={t("MENU_SHOW_BROWSER_TAB_LABEL")}
          icon={<ExternalLink />}
          onClick={() => link.focus(props.ch.login)}
        />
        <MenuItem
          label={
            muted() ? t("MENU_UNMUTE_TAB_LABEL") : t("MENU_MUTE_TAB_LABEL")
          }
          icon={muted() ? <Volume2 /> : <VolumeX />}
          shortcut={
            selected() ? shortcuts.keyFor("link::toggleMute") : undefined
          }
          onClick={() => link.toggleMuted(props.ch.login)}
        />
        <MenuItem
          label={t("MENU_CLOSE_BROWSER_TAB_LABEL")}
          icon={<X />}
          shortcut={selected() ? shortcuts.keyFor("link::closeTab") : undefined}
          onClick={() => link.close(props.ch.login)}
        />
        <Show when={link.gains()}>
          <MenuDivider />
          <TabVolume login={props.ch.login} />
        </Show>
      </Show>

      <MenuDivider />
      <Show when={other()}>
        <Show
          when={pinned()}
          fallback={
            <MenuItem
              label={t("MENU_PIN_LABEL")}
              icon={<Pin />}
              onClick={() => pins.add(props.ch)}
            />
          }
        >
          <MenuItem
            label={t("MENU_UNPIN_LABEL")}
            icon={<PinOff />}
            onClick={() => pins.remove(props.ch.id)}
          />
          <Show when={movable() && pinIndex() > 0}>
            <MenuItem
              label={t("UI_MOVE_UP_LABEL")}
              icon={<ArrowUp />}
              onClick={movePin(-1)}
            />
          </Show>
          <Show when={movable() && pinIndex() < pinnedChannels().length - 1}>
            <MenuItem
              label={t("UI_MOVE_DOWN_LABEL")}
              icon={<ArrowDown />}
              onClick={movePin(1)}
            />
          </Show>
        </Show>
      </Show>
      <MenuItem
        label={t("MENU_COPY_LINK_LABEL")}
        icon={<Link2 />}
        onClick={() => clipboard.copy(url())}
      />

      <Show when={other() || shoutoutFrom()}>
        <MenuDivider />
        <Show when={other()}>
          <MenuItem
            label={t("MENU_RAID_LABEL")}
            icon={<Radio />}
            onClick={() => {
              const me = self();
              if (me) raid.begin(me.id, props.ch).catch(() => {});
            }}
          />
        </Show>
        <Show when={shoutoutFrom()}>
          {(from) => (
            <MenuItem
              label={t("MENU_SHOUTOUT_LABEL")}
              icon={<Megaphone />}
              onClick={() => {
                sendShoutout({
                  fromBroadcasterId: from().id,
                  toBroadcasterId: props.ch.id,
                }).catch(() => {});
              }}
            />
          )}
        </Show>
      </Show>

      <CopyPayloadItem show={developerMode()} data={props.ch} />
      <Show when={props.place === "rail" && props.onLogout}>
        {(logout) => (
          <>
            <MenuDivider />
            <MenuItem
              label={t("MENU_SIGN_OUT_LABEL")}
              icon={<LogOut />}
              tone="negative"
              onClick={logout()}
            />
          </>
        )}
      </Show>
    </Menu>
  );
}
