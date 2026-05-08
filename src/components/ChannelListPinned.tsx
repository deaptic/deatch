import { createSignal, For, Show } from "solid-js";
import { Channel } from "./ChannelList";
import ChannelListItem from "./ChannelListItem";

type Props = {
  pinned: Channel[];
  liveById: Map<string, Channel>;
  onReorder: (from: number, to: number) => void;
  onSelect: (ch: Channel) => void;
  selectedId: string | null;
  onContextMenu: (ch: Channel, x: number, y: number) => void;
};

export default function ChannelListPinned(props: Props) {
  const [dragIndex, setDragIndex] = createSignal<number | null>(null);
  const [overIndex, setOverIndex] = createSignal<number | null>(null);

  function startDrag(e: MouseEvent, idx: number) {
    if (e.button !== 0) return;
    e.preventDefault();
    setDragIndex(idx);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    const onMove = (ev: MouseEvent) => {
      const row = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("[data-pinned-index]") as HTMLElement | null;
      const i = row ? parseInt(row.dataset.pinnedIndex!) : null;
      setOverIndex(i !== null && !isNaN(i) ? i : null);
    };

    const onUp = () => {
      const over = overIndex();
      if (over !== null && over !== idx) props.onReorder(idx, over);
      setDragIndex(null);
      setOverIndex(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return (
    <Show when={props.pinned.length > 0}>
      <div class="pt-2">
        <For each={props.pinned}>
          {(p, index) => {
            const ch = () => props.liveById.get(p.user_id) ?? p;
            const isOver = () => overIndex() === index() && dragIndex() !== index();
            return (
              <div
                data-pinned-index={index()}
                class={`relative border-t-2 transition-colors ${isOver() ? "border-[#9146ff]" : "border-transparent"}`}
                style={{ opacity: dragIndex() === index() ? 0.4 : 1 }}
                onMouseDown={(e) => startDrag(e, index())}
              >
                <ChannelListItem
                  avatar={ch().profile_image_url}
                  channel={ch().user_name}
                  game={ch().game_name ?? "Offline"}
                  viewerCount={ch().viewer_count}
                  isLive={props.liveById.has(p.user_id)}
                  isSelected={props.selectedId === p.user_id}
                  onClick={() => props.onSelect(ch())}
                  onContextMenu={(x, y) => props.onContextMenu(ch(), x, y)}
                />
              </div>
            );
          }}
        </For>
      </div>
    </Show>
  );
}
