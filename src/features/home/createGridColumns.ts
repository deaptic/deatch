import { createSignal, onCleanup } from "solid-js";

export function createGridColumns(): {
  columns: () => number;
  setRef: (el: HTMLElement) => void;
} {
  const [columns, setColumns] = createSignal(1);
  return {
    columns,
    setRef: (el) => {
      let width = -1;
      let frame = 0;
      const measure = () => {
        const tracks = getComputedStyle(el)
          .gridTemplateColumns.split(" ")
          .filter(Boolean).length;
        setColumns(Math.max(1, tracks));
      };
      const observer = new ResizeObserver(([entry]) => {
        const next = entry?.contentRect.width ?? 0;
        if (next === width) return;
        width = next;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(measure);
      });
      observer.observe(el);
      onCleanup(() => {
        cancelAnimationFrame(frame);
        observer.disconnect();
      });
    },
  };
}
