import { createSignal, type JSX, onCleanup, Show } from "solid-js";
import Tooltip from "./Tooltip.tsx";
import { SIDE_GAP } from "./Popover.tsx";
import { coolDown, isWarm, TOOLTIP_DELAY_MS } from "./tooltipTiming.ts";

export function createSideTip(content: () => JSX.Element) {
  const [at, setAt] = createSignal<{ x: number; y: number } | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function place(el: Element) {
    const r = el.getBoundingClientRect();
    setAt({ x: r.right + SIDE_GAP, y: r.top + r.height / 2 });
  }

  function show(el: Element) {
    if (at() || isWarm()) return place(el);
    clearTimeout(timer);
    timer = setTimeout(() => place(el), TOOLTIP_DELAY_MS);
  }

  function hide() {
    clearTimeout(timer);
    if (at()) coolDown();
    setAt(null);
  }

  onCleanup(() => clearTimeout(timer));

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
