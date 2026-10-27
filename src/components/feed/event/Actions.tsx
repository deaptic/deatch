import { ExternalLink } from "lucide-solid";
import { openUrl } from "@tauri-apps/plugin-opener";
import { t } from "../../../lib/i18n/index.ts";
import Toolbar from "../../ui/Toolbar.tsx";
import ToolbarItem from "../../ui/ToolbarItem.tsx";

export default function Actions(props: { clipId: string }) {
  return (
    <Toolbar alwaysVisible>
      <ToolbarItem
        title={t("EVENT_VIEW_CLIP")}
        tone="success"
        onClick={() => openUrl(`https://clips.twitch.tv/${props.clipId}`)}
      >
        <ExternalLink />
      </ToolbarItem>
    </Toolbar>
  );
}
