import { createSignal, onCleanup } from "solid-js";
import { createSizeWatch } from "../../shared/solid/createSizeWatch.ts";

export function createGridColumns(): {
  columns: () => number;
  setRef: (el: HTMLElement) => void;
} {
  const [columns, setColumns] = createSignal(1);
  return {
    columns,
    setRef: (el) => {
      let width = -1;
      const measure = () => {
        const tracks = getComputedStyle(el)
          .gridTemplateColumns.split(" ")
          .filter(Boolean).length;
        setColumns(Math.max(1, tracks));
      };
      const observer = createSizeWatch((entries) => {
        const next = entries.at(-1)?.contentRect.width ?? 0;
        if (next === width) return;
        width = next;
        measure();
      });
      observer.observe(el);
      onCleanup(observer.disconnect);
    },
  };
}
