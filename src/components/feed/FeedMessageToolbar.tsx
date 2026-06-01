import { ClipboardPaste, Ellipsis, Reply } from "lucide-solid";
import { For, Show } from "solid-js";
import type { FeedMessage } from "../../lib/types";
import Toolbar from "../ui/Toolbar";
import ToolbarItem from "../ui/ToolbarItem";
import { feedShowCopypasta } from "../../lib/stores/preferences";

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
          <ToolbarItem title={r.label} onClick={() => props.onReact(props.item, r.value)}>
            <img src={r.url} alt={r.label} class="w-5 h-5 object-contain" />
          </ToolbarItem>
        )}
      </For>
      <ToolbarItem title="Reply" onClick={() => props.onReply(props.item)}>
        <Reply class="w-3.5 h-3.5" />
      </ToolbarItem>
      <Show when={feedShowCopypasta()}>
        <ToolbarItem title="Copypasta" onClick={() => props.onCopypasta(props.item)}>
          <ClipboardPaste class="w-3.5 h-3.5" />
        </ToolbarItem>
      </Show>
      <ToolbarItem
        title="More options"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          props.onMore(rect.left, rect.bottom + 4, props.item);
        }}
      >
        <Ellipsis class="w-3.5 h-3.5" />
      </ToolbarItem>
    </Toolbar>
  );
}
