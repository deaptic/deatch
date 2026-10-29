import { createSignal, type JSX, Show } from "solid-js";
import Tooltip from "./Tooltip.tsx";
import { SIDE_GAP } from "./Popover.tsx";

export function createSideTip(content: () => JSX.Element) {
  const [at, setAt] = createSignal<{ x: number; y: number } | null>(null);

  function show(el: Element) {
    const r = el.getBoundingClientRect();
    setAt({ x: r.right + SIDE_GAP, y: r.top + r.height / 2 });
  }

  const hide = () => setAt(null);

  const view = () => (
    <Show when={at()}>
      {(p) => (
        <Tooltip side="right" x={p().x} y={p().y}>
          {content()}
        </Tooltip>
      )}
    </Show>
  );

  return { show, hide, view };
}
