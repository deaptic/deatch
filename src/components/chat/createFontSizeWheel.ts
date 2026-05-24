import { createSignal, onCleanup } from "solid-js";
import { feedFontSize, setFeedFontSize } from "../../state/preferences";

export function createFontSizeWheel() {
  const [flash, setFlash] = createSignal(false);
  let timer: number | undefined;

  onCleanup(() => clearTimeout(timer));

  function onWheel(e: WheelEvent) {
    if (!e.altKey || e.deltaY === 0) return;
    e.preventDefault();
    setFeedFontSize(feedFontSize() - Math.sign(e.deltaY));
    setFlash(true);
    clearTimeout(timer);
    timer = window.setTimeout(() => setFlash(false), 800);
  }

  return { flash, onWheel };
}
