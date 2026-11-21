import { For } from "solid-js";
import type { Category } from "../../lib/types/index.ts";
import Artwork from "../ui/Artwork.tsx";
import { moveGridFocus } from "../ui/gridKeys.ts";

type Props = {
  categories: Category[];
  selectedId?: string;
  onSelect: (category: Category) => void;
};

export default function CategoryRow(props: Props) {
  return (
    <div
      onKeyDown={moveGridFocus}
      class="-mx-1 flex gap-3 overflow-x-auto px-1 pt-1 pb-2"
    >
      <For each={props.categories}>
        {(category) => (
          <button
            type="button"
            aria-pressed={props.selectedId === category.id}
            onClick={() => props.onSelect(category)}
            class="group w-24 shrink-0 text-left cursor-pointer transition duration-quick ease-out active:scale-97"
          >
            <span
              class="block rounded-md outline-2 outline-offset-2"
              classList={{
                "outline-accent": props.selectedId === category.id,
                "outline-transparent": props.selectedId !== category.id,
              }}
            >
              <Artwork
                src={category.boxArtUrl}
                alt={category.name}
                shape="boxart"
                fit="fill"
                interactive
              />
            </span>
            <p class="mt-1.5 truncate text-small text-ink">{category.name}</p>
          </button>
        )}
      </For>
    </div>
  );
}
