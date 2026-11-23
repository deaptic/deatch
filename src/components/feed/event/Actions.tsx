import { ExternalLink, Scale } from "lucide-solid";
import { Show } from "solid-js";
import * as browser from "../../../lib/services/browser.ts";
import { setChannelForm } from "../../../lib/stores/ui.ts";
import type { FeedEvent } from "../../../lib/types/index.ts";
import { clipUrl } from "../../../lib/utils/twitchUrl.ts";
import { t } from "../../../lib/i18n/index.ts";
import Toolbar from "../../../kit/Toolbar.tsx";
import ToolbarItem from "../../../kit/ToolbarItem.tsx";

export default function Actions(props: { item: FeedEvent }) {
  return (
    <Toolbar alwaysVisible>
      <Show when={props.item.clip}>
        {(clip) => (
          <ToolbarItem
            title={t("FEED_VIEW_CLIP_LABEL")}
            tone="success"
            onClick={() => browser.open(clipUrl(clip().id))}
          >
            <ExternalLink />
          </ToolbarItem>
        )}
      </Show>
      <Show when={props.item.unban_request}>
        <ToolbarItem
          title={t("HEADER_REVIEW_LABEL")}
          onClick={() => setChannelForm("unbans")}
        >
          <Scale />
        </ToolbarItem>
      </Show>
    </Toolbar>
  );
}
