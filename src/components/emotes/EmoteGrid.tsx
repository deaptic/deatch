import { For, Show } from "solid-js";
import type { EmoteGridItem } from "./types";

type Props = {
  items: EmoteGridItem[];
  onSelect: (value: string) => void;
  isFavorite: (value: string) => boolean;
  onToggleFavorite: (item: EmoteGridItem) => void;
};

export default function EmoteGrid(props: Props) {
  return (
    <div class="grid grid-cols-8 gap-0.5">
      <For each={props.items}>
        {(item) => (
          <button
            onClick={() => props.onSelect(item.value)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              props.onToggleFavorite(item);
            }}
            title={item.label}
            class="relative flex items-center justify-center p-1 rounded hover:bg-[#2d2d35] cursor-pointer"
          >
            <img src={item.url} alt={item.label} class="w-7 h-7 object-contain" />
            <Show when={props.isFavorite(item.value)}>
              <span class="absolute top-0 right-0.5 text-[10px] leading-none text-yellow-400 pointer-events-none">★</span>
            </Show>
          </button>
        )}
      </For>
    </div>
  );
}
