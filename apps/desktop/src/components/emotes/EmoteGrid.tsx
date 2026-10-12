import { For } from "solid-js";
import type { EmoteGridItem } from "./types.ts";

type Props = {
  items: EmoteGridItem[];
  onSelect: (
    value: string,
    index: number,
    opts?: { keepOpen?: boolean },
  ) => void;
  isFavorite: (value: string) => boolean;
  onToggleFavorite: (item: EmoteGridItem) => void;
  startIndex: number;
  activeIndex: number;
};

export default function EmoteGrid(props: Props) {
  return (
    <div class="grid grid-cols-8 gap-1">
      <For each={props.items}>
        {(item, i) => {
          const idx = () => props.startIndex + i();
          const active = () => idx() === props.activeIndex;
          return (
            <button
              type="button"
              data-emote-index={idx()}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) =>
                props.onSelect(item.value, idx(), { keepOpen: e.shiftKey })}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                props.onToggleFavorite(item);
              }}
              title={item.label}
              class={`relative aspect-square grid place-items-center rounded-sm cursor-pointer transition-colors duration-snap ${
                active()
                  ? "bg-accent-soft outline outline-2 -outline-offset-2 outline-accent"
                  : "hover:bg-raised"
              }`}
            >
              <img
                src={item.url}
                alt={item.label}
                class="size-7 object-contain"
              />
            </button>
          );
        }}
      </For>
    </div>
  );
}
