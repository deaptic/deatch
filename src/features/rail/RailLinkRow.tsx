import * as link from "../link/index.ts";
import { Eye } from "lucide-solid";
import { Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import { linkAudioLink } from "../../lib/stores/preferences.ts";
import { linkSynced } from "../../lib/stores/view.ts";
import { createPopover } from "../../kit/createPopover.ts";
import { SIDE_GAP } from "../../kit/Popover.tsx";
import TipLabel from "../../kit/TipLabel.tsx";
import LinkMenu from "./LinkMenu.tsx";
import RailRow, { type SubTone } from "./RailRow.tsx";
import RailTile, { type TileTone } from "./RailTile.tsx";

type LinkStatus = {
  sub: string;
  tone: SubTone;
  tile: TileTone | false;
  onClick?: () => void;
};

export default function RailLinkRow(props: { onToggleLink: () => void }) {
  const menu = createPopover();
  let button: HTMLButtonElement | undefined;

  function openMenu() {
    if (!button || menu.state()) return menu.close();
    const rect = button.getBoundingClientRect();
    menu.open(rect.right + SIDE_GAP, rect.top, {});
  }

  const status = (): LinkStatus => {
    if (!link.connected()) {
      return {
        sub: t("RAIL_LINK_ADD_FIREFOX_LABEL"),
        tone: "soft",
        tile: false,
        onClick: openMenu,
      };
    }
    if (link.tabs().length === 0) {
      return { sub: t("RAIL_LINK_NO_TABS_EMPTY"), tone: "soft", tile: false };
    }
    if (linkSynced()) {
      return {
        sub: t(
          linkAudioLink()
            ? "RAIL_LINK_SYNCED_AUDIO_STATUS"
            : "RAIL_LINK_SYNCED_STATUS",
        ),
        tone: "positive",
        tile: "positive",
        onClick: props.onToggleLink,
      };
    }
    return {
      sub: t("RAIL_LINK_NOT_SYNCED_STATUS"),
      tone: "soft",
      tile: false,
      onClick: props.onToggleLink,
    };
  };

  return (
    <>
      <RailRow
        ref={(el) => (button = el)}
        label={t("RAIL_LINK_LABEL")}
        sub={status().sub}
        subTone={status().tone}
        tooltip={
          <TipLabel>
            {t("RAIL_LINK_STATUS_HINT", { status: status().sub })}
          </TipLabel>
        }
        onClick={() => status().onClick?.()}
        onContextMenu={openMenu}
      >
        <RailTile active={status().tile}>
          <Eye />
        </RailTile>
      </RailRow>
      <Show when={menu.state()}>
        {(m) => (
          <LinkMenu
            x={m().x}
            y={m().y}
            opener={() => button}
            onClose={menu.close}
            onToggleSync={props.onToggleLink}
          />
        )}
      </Show>
    </>
  );
}
