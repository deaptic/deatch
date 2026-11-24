import { ExternalLink, Scale } from "lucide-solid";
import { Show } from "solid-js";
import * as browser from "../../../platform/browser.ts";
import { setChannelForm } from "../../navigation/index.ts";
import type { FeedEvent } from "../types.ts";
import { clipUrl } from "../../../shared/twitchUrl.ts";
import { t } from "../../../shared/i18n/index.ts";
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
