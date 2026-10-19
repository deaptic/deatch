import { For } from "solid-js";
import type { EmoteGridItem } from "./types.ts";
import { openMenuAt } from "../../lib/utils/contextMenu.ts";

type Props = {
  items: EmoteGridItem[];
  onSelect: (
    value: string,
    index: number,
    opts?: { keepOpen?: boolean },
  ) => void;
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
              // Not `disabled`: that would also swallow the right-click unfavourite.
              aria-disabled={item.disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) =>
                !item.disabled &&
                props.onSelect(item.value, idx(), { keepOpen: e.shiftKey })}
              onContextMenu={(e) =>
                openMenuAt(e, () => props.onToggleFavorite(item))}
              title={item.disabled
                ? `${item.label} (not available in this channel)`
                : item.label}
              class={`relative aspect-square grid place-items-center rounded-sm transition-colors duration-snap ${
                item.disabled ? "cursor-default" : "cursor-pointer"
              } ${
                active()
                  ? "bg-accent-soft outline outline-2 -outline-offset-2 outline-accent"
                  : "hover:bg-raised"
              }`}
            >
              <img
                src={item.url}
                alt={item.label}
                class={`size-7 object-contain ${
                  item.disabled ? "opacity-40 grayscale" : ""
                }`}
              />
            </button>
          );
        }}
      </For>
    </div>
  );
}
