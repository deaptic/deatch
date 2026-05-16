import { For } from "solid-js";
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
            class="relative flex items-center justify-center p-1 rounded hover:bg-bg cursor-pointer"
          >
            <img src={item.url} alt={item.label} class="w-7 h-7 object-contain" />
          </button>
        )}
      </For>
    </div>
  );
}
