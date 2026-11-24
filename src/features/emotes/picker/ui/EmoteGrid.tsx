import { For } from "solid-js";
import type { EmoteGridItem } from "../types.ts";
import { GRID_COLUMNS } from "../helpers.ts";
import { openMenuAt } from "../../../../kit/contextMenu.ts";
import { emoteZoom } from "../../emoteZoom.ts";

type Props = {
  items: EmoteGridItem[];
  onSelect: (
    value: string,
    index: number,
    opts?: { keepOpen?: boolean },
  ) => void;
  onToggleFavorite: (item: EmoteGridItem) => void;
  onHover: (index: number) => void;
  startIndex: number;
  isActive: (index: number) => boolean;
  keyboard: boolean;
};

export default function EmoteGrid(props: Props) {
  return (
    <div class={`grid gap-1 ${GRID_COLUMNS}`}>
      <For each={props.items}>
        {(item, i) => {
          const idx = () => props.startIndex + i();
          const active = () => props.isActive(idx());
          return (
            <button
              type="button"
              data-emote-index={idx()}
              aria-disabled={item.disabled}
              onMouseDown={(e) => e.preventDefault()}
              onMouseMove={() => props.onHover(idx())}
              onClick={(e) =>
                !item.disabled &&
                props.onSelect(item.value, idx(), { keepOpen: e.shiftKey })
              }
              onContextMenu={(e) =>
                openMenuAt(e, () => props.onToggleFavorite(item))
              }
              class={`relative aspect-square grid place-items-center rounded-sm transition-colors duration-snap ${
                item.disabled
                  ? "cursor-default"
                  : "cursor-pointer pressable active:pressed"
              } ${active() ? "bg-accent-soft" : ""} ${
                active() && props.keyboard
                  ? "outline outline-2 -outline-offset-2 outline-accent"
                  : ""
              }`}
            >
              <img
                src={item.url}
                {...emoteZoom(item.url)}
                alt={item.label}
                loading="lazy"
                decoding="async"
                class={`size-8 object-contain ${
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
