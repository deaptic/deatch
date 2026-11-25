import { For } from "solid-js";
import type { Category } from "../../../shared/types/index.ts";
import Thumbnail from "../../../kit/Thumbnail.tsx";
import { moveGridFocus } from "../../../kit/gridKeys.ts";
import Text from "../../../kit/Text.tsx";

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
            class="group w-24 shrink-0 text-left cursor-pointer pressable active:pressed"
          >
            <span
              class="block rounded-md outline-2 outline-offset-2"
              classList={{
                "outline-accent": props.selectedId === category.id,
                "outline-transparent": props.selectedId !== category.id,
              }}
            >
              <Thumbnail
                src={category.boxArtUrl}
                alt={category.name}
                shape="portrait"
                fit="fill"
                interactive
              />
            </span>
            <Text as="p" truncate size="sm" tone="primary" class="mt-1.5">
              {category.name}
            </Text>
          </button>
        )}
      </For>
    </div>
  );
}
