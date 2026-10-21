import { ClipboardPaste, Ellipsis, Reply } from "lucide-solid";
import { For, Show } from "solid-js";
import { t } from "../../../lib/i18n/index.ts";
import type { FeedMessage } from "../../../lib/types/index.ts";
import { OVERLAY_GAP } from "../../ui/Popover.tsx";
import Toolbar from "../../ui/Toolbar.tsx";
import ToolbarItem from "../../ui/ToolbarItem.tsx";
import { feedShowCopypasta } from "../../../lib/stores/preferences.ts";
import type { Reaction } from "./reaction.ts";

type Props = {
  item: FeedMessage;
  reactions: Reaction[];
  onReact: (msg: FeedMessage, value: string) => void;
  onReply: (msg: FeedMessage) => void;
  onCopypasta: (msg: FeedMessage) => void;
  onMore: (x: number, y: number, msg: FeedMessage) => void;
};

export default function MessageToolbar(props: Props) {
  return (
    <Toolbar>
      <For each={props.reactions}>
        {(r) => (
          <ToolbarItem
            title={r.label}
            onClick={() => props.onReact(props.item, r.value)}
          >
            <img src={r.url} alt={r.label} class="size-5 object-contain" />
          </ToolbarItem>
        )}
      </For>
      <ToolbarItem
        title={t("MESSAGE_REPLY")}
        onClick={() => props.onReply(props.item)}
      >
        <Reply />
      </ToolbarItem>
      <Show when={feedShowCopypasta()}>
        <ToolbarItem
          title={t("MESSAGE_COPYPASTA")}
          onClick={() => props.onCopypasta(props.item)}
        >
          <ClipboardPaste />
        </ToolbarItem>
      </Show>
      <ToolbarItem
        title={t("FEED_MORE_OPTIONS")}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          props.onMore(rect.left, rect.bottom + OVERLAY_GAP, props.item);
        }}
      >
        <Ellipsis />
      </ToolbarItem>
    </Toolbar>
  );
}
