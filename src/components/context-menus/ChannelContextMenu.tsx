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
import * as browser from "../../lib/services/browser.ts";
import { t } from "../../shared/i18n/index.ts";
import Menu from "../../kit/Menu.tsx";
import MenuDivider from "../../kit/MenuDivider.tsx";
import MenuItem from "../../kit/MenuItem.tsx";
import SubMenu from "../../kit/SubMenu.tsx";
import CopyPayloadItem from "./CopyPayloadItem.tsx";
import TabVolume from "./TabVolume.tsx";
import {
  advancedDeveloperMode,
  pinnedChannels,
} from "../../lib/stores/preferences.ts";
import {
  linkHasAudio,
  linkMutedByLogin,
  linkWarmedChannels,
} from "../../lib/stores/link.ts";
import * as link from "../../lib/services/link.ts";
import * as pins from "../../lib/services/pins.ts";
import { hasUnread } from "../../lib/stores/feeds.ts";
import { channelMentionCount } from "../../lib/stores/inbox.ts";
import * as inbox from "../../lib/services/inbox.ts";
import { user } from "../../lib/stores/users.ts";
import { selectedChannel } from "../../lib/stores/view.ts";
import * as raid from "../../lib/services/raid.ts";
import * as shortcuts from "../../shared/keyboard/shortcuts.ts";
import ShoutoutSources, { shoutoutSources } from "./ShoutoutSources.tsx";
import * as clipboard from "../../kit/clipboard.ts";
import { channelUrl } from "../../lib/utils/twitchUrl.ts";
import type { User } from "../../lib/types/index.ts";

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
  const hasTab = () => linkWarmedChannels().some((c) => c.id === props.ch.id);
  const muted = () => linkMutedByLogin()[props.ch.login] === true;
  const pinned = () => pinnedChannels().includes(props.ch.id);
  const selected = () => selectedChannel()?.id === props.ch.id;
  const pinIndex = () => pinnedChannels().indexOf(props.ch.id);
  const movePin = (by: number) => () => pins.move(pinIndex(), pinIndex() + by);
  const unread = () =>
    hasUnread(props.ch.id) || channelMentionCount(props.ch.id) > 0;
  const self = () => user();
  const other = () => self() && props.ch.id !== self()?.id;
  const canShoutout = () => shoutoutSources(props.ch).length > 0;

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
        <Show when={linkHasAudio()}>
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
          <Show when={props.place === "rail" && pinIndex() > 0}>
            <MenuItem
              label={t("UI_MOVE_UP_LABEL")}
              icon={<ArrowUp />}
              onClick={movePin(-1)}
            />
          </Show>
          <Show
            when={
              props.place === "rail" && pinIndex() < pinnedChannels().length - 1
            }
          >
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

      <Show when={other() || canShoutout()}>
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
        <Show when={canShoutout()}>
          <SubMenu label={t("MENU_SHOUTOUT_LABEL")} icon={<Megaphone />}>
            <ShoutoutSources target={props.ch} />
          </SubMenu>
        </Show>
      </Show>

      <CopyPayloadItem show={advancedDeveloperMode()} data={props.ch} />
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
