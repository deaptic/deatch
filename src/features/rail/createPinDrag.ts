import { createSignal, onCleanup } from "solid-js";
import * as pins from "./pins.ts";

const PINNED_INDEX = "[data-pinned-index]";

export function createPinDrag() {
  const [dragging, setDragging] = createSignal<number | null>(null);
  const [over, setOver] = createSignal<number | null>(null);
  let end: (() => void) | undefined;
  onCleanup(() => end?.());

  function start(e: MouseEvent, from: number) {
    if (e.button !== 0) return;
    e.preventDefault();
    setDragging(from);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    const onMove = (ev: MouseEvent) => {
      const row = document
        .elementFromPoint(ev.clientX, ev.clientY)
        ?.closest<HTMLElement>(PINNED_INDEX);
      const index = row?.dataset.pinnedIndex;
      const i = index === undefined ? NaN : parseInt(index);
      setOver(isNaN(i) ? null : i);
    };
    const stop = () => {
      end = undefined;
      setDragging(null);
      setOver(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    const onUp = () => {
      const target = over();
      if (target !== null && target !== from) pins.move(from, target);
      stop();
    };
    end = stop;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return {
    start,
    isDragging: (index: number) => dragging() === index,
    isOver: (index: number) => over() === index && dragging() !== index,
  };
}
