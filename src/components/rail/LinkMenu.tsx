import {
  AudioLines,
  Puzzle,
  RefreshCw,
  Volume2,
  VolumeX,
  X,
} from "lucide-solid";
import { Show } from "solid-js";
import { linkSynced } from "../../lib/stores/view.ts";
import { openUrl } from "@tauri-apps/plugin-opener";
import Menu from "../ui/Menu.tsx";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import { FIREFOX_ADDON_URL } from "../../lib/constants/links.ts";
import { linkConnected, linkWarmedChannels } from "../../lib/stores/link.ts";
import {
  linkAudioLink,
  setLinkAudioLink,
} from "../../lib/stores/preferences.ts";
import * as link from "../../lib/services/link.ts";

type Props = {
  x: number;
  y: number;
  opener?: () => HTMLElement | undefined;
  onClose: () => void;
  onToggleSync: () => void;
};

export default function LinkMenu(props: Props) {
  const run = (action: () => unknown) => () => {
    action();
    props.onClose();
  };
  const hasTabs = () => linkWarmedChannels().length > 0;

  return (
    <Menu x={props.x} y={props.y} opener={props.opener} onClose={props.onClose}>
      <Show
        when={linkConnected()}
        fallback={
          <>
            <MenuItem
              label="Firefox add-on"
              icon={<Puzzle />}
              hint="Get it"
              onClick={run(() => openUrl(FIREFOX_ADDON_URL))}
            />
            <MenuItem
              label="Chrome extension"
              icon={<Puzzle />}
              hint="Coming soon"
              disabled
              onClick={() => {}}
            />
          </>
        }
      >
        <MenuItem
          label="Sync"
          icon={<RefreshCw />}
          hint={linkSynced() ? "On" : "Off"}
          disabled={!hasTabs()}
          onClick={run(props.onToggleSync)}
        />
        <MenuItem
          label="Audio link"
          icon={<AudioLines />}
          hint={linkAudioLink() ? "On" : "Off"}
          onClick={run(() =>
            setLinkAudioLink(!linkAudioLink())
          )}
        />
        <MenuDivider />
        <MenuItem
          label={link.currentMuted() ? "Unmute" : "Mute"}
          icon={link.currentMuted() ? <Volume2 /> : <VolumeX />}
          disabled={link.currentMuted() === null}
          onClick={run(link.toggleMute)}
        />
        <MenuItem
          label="Mute others"
          icon={<VolumeX />}
          disabled={!hasTabs()}
          onClick={run(link.muteOthers)}
        />
        <MenuItem
          label={link.anyUnmuted() ? "Mute all" : "Unmute all"}
          icon={link.anyUnmuted() ? <VolumeX /> : <Volume2 />}
          disabled={!hasTabs()}
          onClick={run(link.toggleMuteAll)}
        />
        <MenuDivider />
        <MenuItem
          label="Close offline tabs"
          icon={<X />}
          disabled={!hasTabs()}
          onClick={run(() =>
            link.closeOffline().catch(() => {})
          )}
        />
        <MenuItem
          label="Close all tabs"
          icon={<X />}
          danger
          disabled={!hasTabs()}
          onClick={run(link.closeAll)}
        />
      </Show>
    </Menu>
  );
}
