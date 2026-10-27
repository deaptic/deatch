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
import { createSignal, Show } from "solid-js";
import { openUrl } from "@tauri-apps/plugin-opener";
import { t } from "../../lib/i18n/index.ts";
import Menu from "../ui/Menu.tsx";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import CopyPayloadItem from "./CopyPayloadItem.tsx";
import TabVolume from "./TabVolume.tsx";
import {
  advancedDeveloperMode,
  pinChannel,
  pinnedChannels,
  reorderPinnedChannels,
  unpinChannel,
} from "../../lib/stores/preferences.ts";
import {
  linkHasAudio,
  linkMutedByLogin,
  linkWarmedChannels,
} from "../../lib/stores/link.ts";
import { linkClose, linkFocus } from "../../lib/api/link.ts";
import * as link from "../../lib/services/link.ts";
import { hasUnread, markSeen } from "../../lib/stores/feeds.ts";
import {
  channelMentionCount,
  markChannelMentionsRead,
} from "../../lib/stores/inbox.ts";
import { user } from "../../lib/stores/users.ts";
import { selectedChannel } from "../../lib/stores/view.ts";
import * as raid from "../../lib/services/raid.ts";
import * as shortcuts from "../../lib/services/shortcuts.ts";
import ShoutoutSources, { shoutoutSources } from "./ShoutoutSources.tsx";
import { copyField } from "../../lib/utils/clipboard.ts";
import { channelUrl } from "../../lib/utils/twitchUrl.ts";
import type { User } from "../../lib/types/index.ts";

/// The rail menu also manages the row itself (unread, Link tab, pin order,
/// logout); anywhere else the menu only acts on the channel.
type Props = {
  x: number;
  y: number;
  align?: "start" | "center" | "end";
  ch: User;
  onClose: () => void;
} & (
  | { place: "rail"; onPin?: (ch: User) => void; onLogout?: () => void }
  | { place: "link"; onOpen?: () => void }
);

export default function ChannelContextMenu(props: Props) {
  const url = () => channelUrl(props.ch.login);
  const hasTab = () => linkWarmedChannels().some((c) => c?.id === props.ch.id);
  const muted = () => linkMutedByLogin()[props.ch.login] === true;
  const pinned = () => pinnedChannels().includes(props.ch.id);
  // Shortcuts act on the open channel, so only its menu shows them.
  const selected = () => selectedChannel()?.id === props.ch.id;
  const pinIndex = () => pinnedChannels().indexOf(props.ch.id);
  const movePin = (by: number) => () =>
    reorderPinnedChannels(pinIndex(), pinIndex() + by);
  const unread = () =>
    hasUnread(props.ch.id) || channelMentionCount(props.ch.id) > 0;
  const self = () => user();
  const other = () => self() && props.ch.id !== self()?.id;
  const canShoutout = () => shoutoutSources(props.ch).length > 0;
  const [pickingShoutout, setPickingShoutout] = createSignal(false);

  const run = (action: () => unknown) => () => {
    action();
    props.onClose();
  };

  return (
    <Menu x={props.x} y={props.y} align={props.align} onClose={props.onClose}>
      <Show
        when={!pickingShoutout()}
        fallback={
          <ShoutoutSources
            target={props.ch}
            onBack={() => setPickingShoutout(false)}
            onDone={props.onClose}
          />
        }
      >
        <Show when={props.place === "link" && props.onOpen}>
          {(open) => (
            <>
              <MenuItem
                label={t("MENU_OPEN_CHAT")}
                icon={<MessageSquare />}
                onClick={run(open())}
              />
              <MenuDivider />
            </>
          )}
        </Show>
        <Show when={props.place === "rail"}>
          <MenuItem
            label={t("MENU_MARK_AS_READ")}
            icon={<CheckCheck />}
            disabled={!unread()}
            onClick={run(() => {
              markSeen(props.ch.id);
              markChannelMentionsRead(props.ch.id);
            })}
          />
          <MenuDivider />
        </Show>
        <Show
          when={props.place === "rail" && hasTab()}
          fallback={
            <MenuItem
              label={t("MENU_OPEN_IN_BROWSER")}
              icon={<ExternalLink />}
              shortcut={
                selected() ? shortcuts.keyFor("link::openTab") : undefined
              }
              onClick={run(() => openUrl(url()))}
            />
          }
        >
          <MenuItem
            label={t("MENU_SHOW_BROWSER_TAB")}
            icon={<ExternalLink />}
            onClick={run(() => linkFocus(props.ch.login))}
          />
          <MenuItem
            label={muted() ? t("MENU_UNMUTE_TAB") : t("MENU_MUTE_TAB")}
            icon={muted() ? <Volume2 /> : <VolumeX />}
            shortcut={
              selected() ? shortcuts.keyFor("link::toggleMute") : undefined
            }
            onClick={run(() => link.toggleMuted(props.ch.login))}
          />
          <MenuItem
            label={t("MENU_CLOSE_BROWSER_TAB")}
            icon={<X />}
            shortcut={
              selected() ? shortcuts.keyFor("link::closeTab") : undefined
            }
            onClick={run(() => linkClose(props.ch.login))}
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
                label={t("MENU_PIN")}
                icon={<Pin />}
                onClick={run(() =>
                  props.place === "rail" && props.onPin
                    ? props.onPin(props.ch)
                    : pinChannel(props.ch.id),
                )}
              />
            }
          >
            <MenuItem
              label={t("MENU_UNPIN")}
              icon={<PinOff />}
              onClick={run(() => unpinChannel(props.ch.id))}
            />
            <Show when={props.place === "rail" && pinIndex() > 0}>
              <MenuItem
                label={t("MENU_MOVE_UP")}
                icon={<ArrowUp />}
                onClick={run(movePin(-1))}
              />
            </Show>
            <Show
              when={
                props.place === "rail" &&
                pinIndex() < pinnedChannels().length - 1
              }
            >
              <MenuItem
                label={t("MENU_MOVE_DOWN")}
                icon={<ArrowDown />}
                onClick={run(movePin(1))}
              />
            </Show>
          </Show>
        </Show>
        <MenuItem
          label={t("MENU_COPY_LINK")}
          icon={<Link2 />}
          onClick={run(() => copyField(url()))}
        />

        <Show when={other() || canShoutout()}>
          <MenuDivider />
          <Show when={other()}>
            <MenuItem
              label={t("MENU_RAID")}
              icon={<Radio />}
              onClick={run(() =>
                raid.begin(self()!.id, props.ch).catch(() => {}),
              )}
            />
          </Show>
          <Show when={canShoutout()}>
            <MenuItem
              label={t("MENU_SHOUTOUT")}
              icon={<Megaphone />}
              submenu
              onClick={() => setPickingShoutout(true)}
            />
          </Show>
        </Show>

        <CopyPayloadItem
          show={advancedDeveloperMode()}
          data={props.ch}
          onClose={props.onClose}
        />
        <Show when={props.place === "rail" && props.onLogout}>
          {(logout) => (
            <>
              <MenuDivider />
              <MenuItem
                label={t("MENU_LOG_OUT")}
                icon={<LogOut />}
                tone="negative"
                onClick={run(logout())}
              />
            </>
          )}
        </Show>
      </Show>
    </Menu>
  );
}
