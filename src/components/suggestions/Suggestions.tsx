import { createEffect, For, type JSX, onMount } from "solid-js";
import { createListNavigation } from "../../lib/primitives/createListNavigation.ts";
import SuggestionItem from "./SuggestionItem.tsx";

type Props<T> = {
  suggestions: () => T[];
  onSelect: (item: T) => void;
  onDismiss: () => void;
  renderItem: (item: T) => JSX.Element;
  selectOnSpace?: boolean;
  ref?: (api: { handleKey: (e: KeyboardEvent) => boolean }) => void;
};

export default function Suggestions<T>(props: Props<T>) {
  let containerRef: HTMLDivElement | undefined;
  const { active, setActive, move } = createListNavigation({
    count: () => props.suggestions().length,
    rowAt: (i) => containerRef?.children[i],
  });

  createEffect(() => {
    props.suggestions();
    setActive(0);
  });

  onMount(() => {
    props.ref?.({
      handleKey: (e) => {
        const s = props.suggestions();
        if (s.length === 0) return false;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          move(e.key === "ArrowDown" ? 1 : -1);
          return true;
        }
        if (
          e.key === "Tab" ||
          (e.key === "Enter" && !e.shiftKey) ||
          (props.selectOnSpace && e.key === " ")
        ) {
          e.preventDefault();
          props.onSelect(s[active()]);
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
      ref={containerRef}
      role="listbox"
      class="absolute bottom-full inset-x-0 mb-2 z-30 p-1.5 bg-overlay border border-line rounded-md overflow-y-auto max-h-60 transition duration-quick ease-out starting:opacity-0 starting:translate-y-1"
    >
      <For each={props.suggestions()}>
        {(s, i) => (
          <SuggestionItem
            active={i() === active()}
            onHover={() => setActive(i())}
            onClick={() => props.onSelect(s)}
          >
            {props.renderItem(s)}
          </SuggestionItem>
        )}
      </For>
    </div>
  );
}
