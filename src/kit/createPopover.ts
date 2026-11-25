import { createSignal } from "solid-js";
import { OVERLAY_GAP } from "./Popover.tsx";

export function createPopover<T extends object = Record<string, never>>() {
  type State = ({ x: number; y: number } & T) | null;
  const [state, setState] = createSignal<State>(null);

  function open(x: number, y: number, extra: T) {
    setState(() => ({ x, y, ...extra }) as State);
  }

  function close() {
    setState(null);
  }

  function update(extra: Partial<T>) {
    setState((s) => (s ? ({ ...s, ...extra } as State) : null));
  }

  return { state, open, close, update };
}

export function createAnchoredToggle(align: "start" | "center") {
  const popover = createPopover();
  function toggle(el: HTMLElement | undefined) {
    if (popover.state() || !el) return popover.close();
    const r = el.getBoundingClientRect();
    const x = align === "center" ? r.left + r.width / 2 : r.left;
    popover.open(x, r.bottom + OVERLAY_GAP, {});
  }
  return { anchor: popover.state, toggle, close: popover.close };
}
