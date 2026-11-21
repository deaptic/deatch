import { createSignal, onCleanup } from "solid-js";

export function createMeasuredHeight() {
  const [height, setHeight] = createSignal(0);
  const observer = new ResizeObserver(([entry]) => {
    const box = entry?.borderBoxSize[0];
    if (box) setHeight(box.blockSize);
  });
  onCleanup(() => observer.disconnect());
  return {
    height,
    measure: (el: Element) => observer.observe(el, { box: "border-box" }),
  };
}
