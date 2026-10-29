import { createEffect, For, type JSX, on, onMount } from "solid-js";
import {
  createListbox,
  type ListboxField,
} from "../../lib/reactive/createListbox.ts";
import SuggestionItem from "./SuggestionItem.tsx";

export type SuggestionsApi = {
  handleKey: (e: KeyboardEvent) => boolean;
  field: ListboxField;
};

type Props<T> = {
  suggestions: () => T[];
  onSelect: (item: T) => void;
  onDismiss: () => void;
  renderItem: (item: T) => JSX.Element;
  selectOnSpace?: boolean;
  ref?: (api: SuggestionsApi) => void;
};

export default function Suggestions<T>(props: Props<T>) {
  const listbox = createListbox({ count: () => props.suggestions().length });

  createEffect(
    on(props.suggestions, () => listbox.setActive(0), { defer: true }),
  );

  onMount(() => {
    props.ref?.({
      field: listbox.field,
      handleKey: (e) => {
        const s = props.suggestions();
        if (s.length === 0) return false;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          listbox.move(e.key === "ArrowDown" ? 1 : -1);
          return true;
        }
        if (
          e.key === "Tab" ||
          (e.key === "Enter" && !e.shiftKey) ||
          (props.selectOnSpace && e.key === " ")
        ) {
          const picked = s[listbox.active()];
          if (!picked) return false;
          e.preventDefault();
          props.onSelect(picked);
          return true;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          props.onDismiss();
          return true;
        }
        return false;
      },
    });
  });

  return (
    <div
      {...listbox.list}
      class="absolute bottom-full inset-x-0 mb-2 z-30 p-1.5 bg-overlay border border-line rounded-md overflow-y-auto max-h-60 transition duration-quick ease-out starting:opacity-0 starting:translate-y-1"
    >
      <For each={props.suggestions()}>
        {(s, i) => (
          <SuggestionItem
            {...listbox.option(i)}
            onHover={() => listbox.setActive(i())}
            onClick={() => props.onSelect(s)}
          >
            {props.renderItem(s)}
          </SuggestionItem>
        )}
      </For>
    </div>
  );
}
