import { ExternalLink } from "lucide-solid";
import * as browser from "../../../lib/services/browser.ts";
import { clipUrl } from "../../../lib/utils/twitchUrl.ts";
import { t } from "../../../lib/i18n/index.ts";
import Toolbar from "../../ui/Toolbar.tsx";
import ToolbarItem from "../../ui/ToolbarItem.tsx";

export default function Actions(props: { clipId: string }) {
  return (
    <Toolbar alwaysVisible>
      <ToolbarItem
        title={t("FEED_VIEW_CLIP_LABEL")}
        tone="success"
        onClick={() => browser.open(clipUrl(props.clipId))}
      >
        <ExternalLink />
      </ToolbarItem>
    </Toolbar>
  );
}
