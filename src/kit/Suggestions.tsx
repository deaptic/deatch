import { createEffect, For, type JSX, on, onCleanup, onMount } from "solid-js";
import * as shortcuts from "../shared/keyboard/shortcuts.ts";
import {
  createListbox,
  type ListboxField,
} from "../shared/solid/createListbox.ts";
import ListPanel from "./ListPanel.tsx";
import OptionRow from "./OptionRow.tsx";

export type SuggestionsApi = {
  handleKey: (e: KeyboardEvent) => boolean;
  active: () => number;
  field: ListboxField;
};

type Props<T> = {
  suggestions: () => T[];
  onSelect: (item: T) => void;
  onClose: () => void;
  renderItem: (item: T) => JSX.Element;
  selectOnSpace?: boolean;
  ownsEscape?: boolean;
  ref?: (api: SuggestionsApi) => void;
};

export default function Suggestions<T>(props: Props<T>) {
  const listbox = createListbox({ count: () => props.suggestions().length });
  if (props.ownsEscape) {
    onCleanup(shortcuts.registerLocal("escape", () => props.onClose()));
  }

  createEffect(
    on(props.suggestions, () => listbox.setActive(0), { defer: true }),
  );

  onMount(() => {
    props.ref?.({
      field: listbox.field,
      active: listbox.active,
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
          props.onClose();
          return true;
        }
        return false;
      },
    });
  });

  return (
    <ListPanel {...listbox.list} placement="above">
      <For each={props.suggestions()}>
        {(s, i) => (
          <OptionRow
            {...listbox.option(i)}
            size="auto"
            active={i() === listbox.active()}
            onMouseMove={() => listbox.setActive(i())}
            onClick={() => props.onSelect(s)}
          >
            {props.renderItem(s)}
          </OptionRow>
        )}
      </For>
    </ListPanel>
  );
}
