import {
  CheckCheck,
  ExternalLink,
  Link2,
  LogOut,
  Megaphone,
  Pin,
  PinOff,
  Radio,
  Volume2,
  VolumeX,
  X,
} from "lucide-solid";
import { createSignal, Show } from "solid-js";
import { openUrl } from "@tauri-apps/plugin-opener";
import Menu from "../ui/Menu.tsx";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import CopyPayloadItem from "./CopyPayloadItem.tsx";
import {
  advancedDeveloperMode,
  pinChannel,
  pinnedChannels,
  unpinChannel,
} from "../../lib/stores/preferences.ts";
import { linkMutedByLogin, linkWarmedChannels } from "../../lib/stores/link.ts";
import { linkClose, linkFocus, linkSetMuted } from "../../lib/api/link.ts";
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
import type { User } from "../../lib/types/index.ts";

type Props = {
  x: number;
  y: number;
  align?: "start" | "center" | "end";
  ch: User;
  onClose: () => void;
  onPin?: (ch: User) => void;
  onLogout?: () => void;
};

export default function ChannelContextMenu(props: Props) {
  const url = () => `https://twitch.tv/${props.ch.login}`;
  const hasTab = () => linkWarmedChannels().some((c) => c?.id === props.ch.id);
  const muted = () => linkMutedByLogin()[props.ch.login] === true;
  const pinned = () => pinnedChannels().includes(props.ch.id);
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
        <MenuItem
          label="Mark as read"
          icon={<CheckCheck />}
          disabled={!unread()}
          onClick={run(() => {
            markSeen(props.ch.id);
            markChannelMentionsRead(props.ch.id);
          })}
        />
        <MenuDivider />
        <Show
          when={hasTab()}
          fallback={
            <MenuItem
              label="Open in browser"
              icon={<ExternalLink />}
              onClick={run(() => openUrl(url()))}
            />
          }
        >
          <MenuItem
            label="Show browser tab"
            icon={<ExternalLink />}
            onClick={run(() =>
              linkFocus(props.ch.login)
            )}
          />
          <MenuItem
            label={muted() ? "Unmute tab" : "Mute tab"}
            icon={muted() ? <Volume2 /> : <VolumeX />}
            shortcut={selectedChannel()?.id === props.ch.id
              ? shortcuts.keyFor("link::toggleMute")
              : undefined}
            onClick={run(() =>
              linkSetMuted(props.ch.login, !muted())
            )}
          />
          <MenuItem
            label="Close browser tab"
            icon={<X />}
            onClick={run(() => linkClose(props.ch.login))}
          />
        </Show>

        <MenuDivider />
        <Show when={other()}>
          <Show
            when={pinned()}
            fallback={
              <MenuItem
                label="Pin"
                icon={<Pin />}
                onClick={run(() =>
                  props.onPin ? props.onPin(props.ch) : pinChannel(props.ch.id)
                )}
              />
            }
          >
            <MenuItem
              label="Unpin"
              icon={<PinOff />}
              onClick={run(() => unpinChannel(props.ch.id))}
            />
          </Show>
        </Show>
        <MenuItem
          label="Copy link"
          icon={<Link2 />}
          onClick={run(() => copyField(url()))}
        />

        <Show when={other() || canShoutout()}>
          <MenuDivider />
          <Show when={other()}>
            <MenuItem
              label="Raid"
              icon={<Radio />}
              onClick={run(() =>
                raid.begin(self()!.id, props.ch).catch(() => {})
              )}
            />
          </Show>
          <Show when={canShoutout()}>
            <MenuItem
              label="Shoutout"
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
        <Show when={props.onLogout}>
          <MenuDivider />
          <MenuItem
            label="Log out"
            icon={<LogOut />}
            danger
            onClick={run(() => props.onLogout?.())}
          />
        </Show>
      </Show>
    </Menu>
  );
}
