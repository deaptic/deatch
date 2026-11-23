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
import { linkSynced } from "../navigation/index.ts";
import * as browser from "../../platform/browser.ts";
import Menu from "../../kit/Menu.tsx";
import MenuDivider from "../../kit/MenuDivider.tsx";
import MenuItem from "../../kit/MenuItem.tsx";
import { FIREFOX_ADDON_URL } from "./links.ts";
import {
  linkAudioLink,
  linkCompressor,
  setLinkAudioLink,
  setLinkCompressor,
} from "../preferences/index.ts";
import * as link from "../link/index.ts";
import * as shortcuts from "../../shared/keyboard/shortcuts.ts";
import { t } from "../../shared/i18n/index.ts";

type Props = {
  x: number;
  y: number;
  opener?: () => HTMLElement | undefined;
  onClose: () => void;
  onToggleSync: () => void;
};

export default function LinkMenu(props: Props) {
  const hasTabs = () => link.tabs().length > 0;

  return (
    <Menu x={props.x} y={props.y} opener={props.opener} onClose={props.onClose}>
      <Show
        when={link.connected()}
        fallback={
          <>
            <MenuItem
              label={t("RAIL_LINK_FIREFOX_LABEL")}
              icon={<Puzzle />}
              hint={t("RAIL_LINK_GET_IT_LABEL")}
              onClick={() => browser.open(FIREFOX_ADDON_URL)}
            />
            <MenuItem
              label={t("RAIL_LINK_CHROME_LABEL")}
              icon={<Puzzle />}
              hint={t("RAIL_LINK_COMING_SOON_LABEL")}
              disabled
            />
          </>
        }
      >
        <MenuItem
          label={t("RAIL_LINK_SYNC_LABEL")}
          icon={<RefreshCw />}
          active={linkSynced()}
          shortcut={shortcuts.keyFor("link::toggle")}
          disabled={!hasTabs()}
          onClick={props.onToggleSync}
        />
        <MenuItem
          label={t("RAIL_LINK_AUDIO_LABEL")}
          icon={<AudioLines />}
          active={linkAudioLink()}
          shortcut={shortcuts.keyFor("link::toggleAudioLink")}
          onClick={() => setLinkAudioLink(!linkAudioLink())}
        />
        <Show when={link.hasAudio()}>
          <MenuItem
            label={t("RAIL_LINK_COMPRESSOR_LABEL")}
            icon={<AudioWaveform />}
            active={linkCompressor()}
            onClick={() => setLinkCompressor(!linkCompressor())}
          />
        </Show>
        <MenuDivider />
        <MenuItem
          label={t(
            link.currentMuted()
              ? "RAIL_LINK_UNMUTE_LABEL"
              : "RAIL_LINK_MUTE_LABEL",
          )}
          icon={link.currentMuted() ? <Volume2 /> : <VolumeX />}
          shortcut={shortcuts.keyFor("link::toggleMute")}
          disabled={link.currentMuted() === null}
          onClick={link.toggleMute}
        />
        <MenuItem
          label={t("RAIL_LINK_MUTE_OTHERS_LABEL")}
          icon={<VolumeX />}
          shortcut={shortcuts.keyFor("link::muteOthers")}
          disabled={!hasTabs()}
          onClick={link.muteOthers}
        />
        <MenuItem
          label={t(
            link.anyUnmuted()
              ? "RAIL_LINK_MUTE_ALL_LABEL"
              : "RAIL_LINK_UNMUTE_ALL_LABEL",
          )}
          icon={link.anyUnmuted() ? <VolumeX /> : <Volume2 />}
          shortcut={shortcuts.keyFor("link::toggleMuteAll")}
          disabled={!hasTabs()}
          onClick={link.toggleMuteAll}
        />
        <MenuDivider />
        <MenuItem
          label={t("RAIL_LINK_CLOSE_OFFLINE_LABEL")}
          icon={<X />}
          disabled={!hasTabs()}
          onClick={() => link.closeOffline().catch(() => {})}
        />
        <MenuItem
          label={t("RAIL_LINK_CLOSE_ALL_LABEL")}
          icon={<X />}
          tone="negative"
          disabled={!hasTabs()}
          onClick={link.closeAll}
        />
      </Show>
    </Menu>
  );
}
