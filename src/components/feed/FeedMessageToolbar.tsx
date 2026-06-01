import { ClipboardPaste, Ellipsis, Reply } from "lucide-solid";
import { For, Show } from "solid-js";
import type { FeedMessage } from "../../lib/types/index.ts";
import Toolbar from "../ui/Toolbar.tsx";
import ToolbarItem from "../ui/ToolbarItem.tsx";
import { feedShowCopypasta } from "../../lib/stores/preferences.ts";

type Reaction = { label: string; value: string; url: string };

type Props = {
  item: FeedMessage;
  reactions: Reaction[];
  onReact: (msg: FeedMessage, value: string) => void;
  onReply: (msg: FeedMessage) => void;
  onCopypasta: (msg: FeedMessage) => void;
  onMore: (x: number, y: number, msg: FeedMessage) => void;
};

export default function FeedMessageToolbar(props: Props) {
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
      <ToolbarItem title="Reply" onClick={() => props.onReply(props.item)}>
        <Reply class="size-3.5" />
      </ToolbarItem>
      <Show when={feedShowCopypasta()}>
        <ToolbarItem
          title="Copypasta"
          onClick={() => props.onCopypasta(props.item)}
        >
          <ClipboardPaste class="size-3.5" />
        </ToolbarItem>
      </Show>
      <ToolbarItem
        title="More options"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          props.onMore(rect.left, rect.bottom + 4, props.item);
        }}
      >
        <Ellipsis class="size-3.5" />
      </ToolbarItem>
    </Toolbar>
  );
}
