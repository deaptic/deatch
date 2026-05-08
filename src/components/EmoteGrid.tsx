import { For, JSX, Show } from "solid-js";
import { isFavorite, toggleFavorite } from "../emotes";

export type GridItem = { value: string; url: string; label: string; accessible?: boolean };

export function PickerSection(props: { label: string; children: JSX.Element }) {
  return (
    <div>
      <p class="text-[#5c5c7a] text-xs font-semibold uppercase tracking-wider px-1 py-1.5">
        {props.label}
      </p>
      {props.children}
    </div>
  );
}

export function EmoteGrid(props: { items: GridItem[]; onSelect: (value: string) => void }) {
  return (
    <div class="grid grid-cols-8 gap-0.5">
      <For each={props.items}>
        {(item) => (
          <button
            onClick={() => item.accessible !== false && props.onSelect(item.value)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite({ value: item.value, url: item.url, label: item.label });
            }}
            title={item.label}
            class={`relative flex items-center justify-center p-1 rounded ${item.accessible === false ? "opacity-40 cursor-not-allowed" : "hover:bg-[#2d2d35] cursor-pointer"}`}
          >
            <img src={item.url} alt={item.label} class="w-7 h-7 object-contain" />
            <Show when={isFavorite(item.value)}>
              <span class="absolute top-0 right-0.5 text-[10px] leading-none text-yellow-400 pointer-events-none">★</span>
            </Show>
          </button>
        )}
      </For>
    </div>
  );
}
