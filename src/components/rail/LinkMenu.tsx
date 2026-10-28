import {
  AudioLines,
  AudioWaveform,
  Puzzle,
  RefreshCw,
  Volume2,
  VolumeX,
  X,
} from "lucide-solid";
import { Show } from "solid-js";
import { linkSynced } from "../../lib/stores/view.ts";
import * as browser from "../../lib/services/browser.ts";
import Menu from "../ui/Menu.tsx";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import { FIREFOX_ADDON_URL } from "../../lib/constants/links.ts";
import {
  linkConnected,
  linkHasAudio,
  linkWarmedChannels,
} from "../../lib/stores/link.ts";
import {
  linkAudioLink,
  linkCompressor,
  setLinkAudioLink,
  setLinkCompressor,
} from "../../lib/stores/preferences.ts";
import * as link from "../../lib/services/link.ts";
import * as shortcuts from "../../lib/services/shortcuts.ts";
import { t } from "../../lib/i18n/index.ts";

type Props = {
  x: number;
  y: number;
  opener?: () => HTMLElement | undefined;
  onClose: () => void;
  onToggleSync: () => void;
};

export default function LinkMenu(props: Props) {
  const hasTabs = () => linkWarmedChannels().length > 0;

  return (
    <Menu x={props.x} y={props.y} opener={props.opener} onClose={props.onClose}>
      <Show
        when={linkConnected()}
        fallback={
          <>
            <MenuItem
              label={t("RAIL_LINK_FIREFOX")}
              icon={<Puzzle />}
              hint={t("RAIL_LINK_GET_IT")}
              onClick={() => browser.open(FIREFOX_ADDON_URL)}
            />
            <MenuItem
              label={t("RAIL_LINK_CHROME")}
              icon={<Puzzle />}
              hint={t("RAIL_LINK_COMING_SOON")}
              disabled
            />
          </>
        }
      >
        <MenuItem
          label={t("RAIL_LINK_SYNC")}
          icon={<RefreshCw />}
          active={linkSynced()}
          shortcut={shortcuts.keyFor("link::toggle")}
          disabled={!hasTabs()}
          onClick={props.onToggleSync}
        />
        <MenuItem
          label={t("RAIL_LINK_AUDIO")}
          icon={<AudioLines />}
          active={linkAudioLink()}
          shortcut={shortcuts.keyFor("link::toggleAudioLink")}
          onClick={() => setLinkAudioLink(!linkAudioLink())}
        />
        <Show when={linkHasAudio()}>
          <MenuItem
            label={t("SETTINGS_LINK_COMPRESSOR")}
            icon={<AudioWaveform />}
            active={linkCompressor()}
            onClick={() => setLinkCompressor(!linkCompressor())}
          />
        </Show>
        <MenuDivider />
        <MenuItem
          label={t(link.currentMuted() ? "RAIL_LINK_UNMUTE" : "RAIL_LINK_MUTE")}
          icon={link.currentMuted() ? <Volume2 /> : <VolumeX />}
          shortcut={shortcuts.keyFor("link::toggleMute")}
          disabled={link.currentMuted() === null}
          onClick={link.toggleMute}
        />
        <MenuItem
          label={t("RAIL_LINK_MUTE_OTHERS")}
          icon={<VolumeX />}
          shortcut={shortcuts.keyFor("link::muteOthers")}
          disabled={!hasTabs()}
          onClick={link.muteOthers}
        />
        <MenuItem
          label={t(
            link.anyUnmuted() ? "RAIL_LINK_MUTE_ALL" : "RAIL_LINK_UNMUTE_ALL",
          )}
          icon={link.anyUnmuted() ? <VolumeX /> : <Volume2 />}
          shortcut={shortcuts.keyFor("link::toggleMuteAll")}
          disabled={!hasTabs()}
          onClick={link.toggleMuteAll}
        />
        <MenuDivider />
        <MenuItem
          label={t("RAIL_LINK_CLOSE_OFFLINE")}
          icon={<X />}
          disabled={!hasTabs()}
          onClick={() => link.closeOffline().catch(() => {})}
        />
        <MenuItem
          label={t("RAIL_LINK_CLOSE_ALL")}
          icon={<X />}
          tone="negative"
          disabled={!hasTabs()}
          onClick={link.closeAll}
        />
      </Show>
    </Menu>
  );
}
