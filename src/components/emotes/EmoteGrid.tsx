import { For } from "solid-js";
import type { EmoteGridItem } from "./types.ts";

type Props = {
  items: EmoteGridItem[];
  onSelect: (value: string, index: number, opts?: { keepOpen?: boolean }) => void;
  isFavorite: (value: string) => boolean;
  onToggleFavorite: (item: EmoteGridItem) => void;
  startIndex: number;
  activeIndex: number;
};

export default function EmoteGrid(props: Props) {
  return (
    <div class="grid grid-cols-8 gap-0.5">
      <For each={props.items}>
        {(item, i) => {
          const idx = () => props.startIndex + i();
          const active = () => idx() === props.activeIndex;
          return (
            <button
              data-emote-index={idx()}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => props.onSelect(item.value, idx(), { keepOpen: e.shiftKey })}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                props.onToggleFavorite(item);
              }}
              title={item.label}
              class={`relative flex items-center justify-center p-1 rounded cursor-pointer ${
                active() ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-bg"
              }`}
            >
              <img src={item.url} alt={item.label} class="w-7 h-7 object-contain" />
            </button>
          );
        }}
      </For>
    </div>
  );
}
