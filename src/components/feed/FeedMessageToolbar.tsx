import { For, Show } from "solid-js";
import type { FeedMessage } from "../../types";
import Toolbar from "../../ui/Toolbar";
import ToolbarItem from "../../ui/ToolbarItem";
import ReplyIcon from "../../icons/ReplyIcon";
import DotsIcon from "../../icons/DotsIcon";
import PastaIcon from "../../icons/PastaIcon";
import { feedShowCopypasta } from "../../state/preferences";

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
        <ReplyIcon class="w-3.5 h-3.5" />
      </ToolbarItem>
      <Show when={feedShowCopypasta()}>
        <ToolbarItem title="Copypasta" onClick={() => props.onCopypasta(props.item)}>
          <PastaIcon class="w-3.5 h-3.5" />
        </ToolbarItem>
      </Show>
      <ToolbarItem
        title="More options"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          props.onMore(rect.left, rect.bottom + 4, props.item);
        }}
      >
        <DotsIcon class="w-3.5 h-3.5" />
      </ToolbarItem>
    </Toolbar>
  );
}
