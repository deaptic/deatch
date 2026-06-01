import { createEffect, createSignal, For, type JSX, onMount } from "solid-js";
import SuggestionItem from "./SuggestionItem.tsx";

type Props<T> = {
  suggestions: () => T[];
  onSelect: (item: T) => void;
  onDismiss: () => void;
  renderItem: (item: T) => JSX.Element;
  ref?: (api: { handleKey: (e: KeyboardEvent) => boolean }) => void;
};

export default function Suggestions<T>(props: Props<T>) {
  const [acIndex, setAcIndex] = createSignal(0);
  let containerRef: HTMLDivElement | undefined;

  createEffect(() => {
    props.suggestions();
    setAcIndex(0);
  });

  createEffect(() => {
    const item = containerRef?.children[acIndex()] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  });

  onMount(() => {
    props.ref?.({
      handleKey: (e) => {
        const s = props.suggestions();
        if (s.length === 0) return false;
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setAcIndex((i) => Math.min(i + 1, s.length - 1));
          return true;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setAcIndex((i) => Math.max(i - 1, 0));
          return true;
        }
        if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
          e.preventDefault();
          props.onSelect(s[acIndex()]);
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
      class="absolute bottom-full inset-x-0 mb-3 z-30 bg-bg-dark border border-border-muted rounded-lg shadow-2xl overflow-y-auto max-h-60"
    >
      <For each={props.suggestions()}>
        {(s, i) => (
          <SuggestionItem
            active={i() === acIndex()}
            onClick={() => props.onSelect(s)}
          >
            {props.renderItem(s)}
          </SuggestionItem>
        )}
      </For>
    </div>
  );
}
