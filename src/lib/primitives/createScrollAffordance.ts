import { createSignal } from "solid-js";

export interface ScrollAffordance {
  canUp: () => boolean;
  canDown: () => boolean;
  setRef: (el: HTMLDivElement) => void;
  update: () => void;
  scrollByOne: (direction: -1 | 1) => void;
}

export function createScrollAffordance(): ScrollAffordance {
  const [canUp, setCanUp] = createSignal(false);
  const [canDown, setCanDown] = createSignal(false);
  let el: HTMLDivElement | undefined;

  function update() {
    if (!el) {
      setCanUp(false);
      setCanDown(false);
      return;
    }
    setCanUp(el.scrollTop > 0);
    setCanDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  }

  function scrollByOne(direction: -1 | 1) {
    if (!el) return;
    const first = el.querySelector("[data-channel-id]") as HTMLElement | null;
    const step = first?.offsetHeight ?? 48;
    el.scrollBy({ top: direction * step, behavior: "smooth" });
  }

  return {
    canUp,
    canDown,
    setRef: (e) => {
      el = e;
    },
    update,
    scrollByOne,
  };
}
