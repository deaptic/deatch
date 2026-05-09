import { createSignal, For, Show } from "solid-js";
import { Channel } from "./ChannelList";
import ChannelListItem from "./ChannelListItem";
import { unreadCount } from "../chat-feed";

type Props = {
  pinned: Channel[];
  liveById: Map<string, Channel>;
  loading?: boolean;
  onReorder: (from: number, to: number) => void;
  onSelect: (ch: Channel) => void;
  selectedId: string | null;
  onContextMenu: (ch: Channel, x: number, y: number) => void;
  onMiddleClick?: (ch: Channel) => void;
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
      const row = document
        .elementFromPoint(ev.clientX, ev.clientY)
        ?.closest("[data-pinned-index]") as HTMLElement | null;
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
      <div>
        <Show
          when={!props.loading}
          fallback={
            <For each={props.pinned}>
              {() => (
                <div class="w-full flex items-center justify-center p-2">
                  <div class="w-8 h-8 rounded-lg bg-[#2d2d35] animate-pulse" />
                </div>
              )}
            </For>
          }
        >
          <For each={props.pinned}>
            {(p, index) => {
              const ch = () => props.liveById.get(p.user_id) ?? p;
              const isOver = () => overIndex() === index() && dragIndex() !== index();
              return (
                <div
                  data-pinned-index={index()}
                  class="relative"
                  style={{ opacity: dragIndex() === index() ? 0.4 : 1 }}
                  onMouseDown={(e) => startDrag(e, index())}
                >
                  <Show when={isOver()}>
                    <div class="pointer-events-none absolute left-1 right-1 -top-px h-0.5 bg-[#9146ff] rounded-full z-10" />
                  </Show>
                  <ChannelListItem
                    avatar={ch().profile_image_url}
                    channel={ch().user_name}
                    game={ch().game_name ?? "Offline"}
                    viewerCount={ch().viewer_count}
                    isLive={props.liveById.has(p.user_id)}
                    isSelected={props.selectedId === p.user_id}
                    unread={unreadCount(p.user_id)}
                    onClick={() => props.onSelect(ch())}
                    onMiddleClick={() => props.onMiddleClick?.(ch())}
                    onContextMenu={(x, y) => props.onContextMenu(ch(), x, y)}
                  />
                </div>
              );
            }}
          </For>
        </Show>
      </div>
    </Show>
  );
}
