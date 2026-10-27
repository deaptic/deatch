import { ClipboardPaste, Ellipsis, Reply } from "lucide-solid";
import { For, Show } from "solid-js";
import { t } from "../../../lib/i18n/index.ts";
import type {
  FeedMessage as Message,
  Reaction,
} from "../../../lib/types/index.ts";
import { feedShowCopypasta } from "../../../lib/stores/preferences.ts";
import { OVERLAY_GAP } from "../../ui/Popover.tsx";
import Toolbar from "../../ui/Toolbar.tsx";
import ToolbarItem from "../../ui/ToolbarItem.tsx";

export default function Actions(props: {
  item: Message;
  reactions: Reaction[];
  onReact: (msg: Message, value: string) => void;
  onReply: (msg: Message) => void;
  onCopypasta: (msg: Message) => void;
  onMore: (x: number, y: number, msg: Message) => void;
}) {
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
