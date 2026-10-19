import { createSignal, onCleanup, onMount, Show } from "solid-js";
import Tooltip from "./Tooltip.tsx";
import { SIDE_GAP } from "./Popover.tsx";

const DELAY_MS = 300;
/// Below this much room above the element the tip opens beneath it instead.
const ROOM_ABOVE = 64;

type Tip = {
  text: string;
  x: number;
  y: number;
  placement: "above" | "below";
};

/// Shows `data-tip` on any hovered element after a short delay, in place of
/// the native `title` tooltip. One delegated listener serves the whole app.
export default function TooltipHost() {
  const [tip, setTip] = createSignal<Tip | null>(null);
  let anchor: HTMLElement | null = null;
  let timer: number | undefined;

  function hide() {
    clearTimeout(timer);
    anchor = null;
    setTip(null);
  }

  function show(el: HTMLElement) {
    const text = el.dataset.tip;
    if (!text || !el.isConnected) return;
    const r = el.getBoundingClientRect();
    const above = r.top >= ROOM_ABOVE;
    setTip({
      text,
      x: r.left + r.width / 2,
      y: above ? r.top - SIDE_GAP : r.bottom + SIDE_GAP,
      placement: above ? "above" : "below",
    });
  }

  const onOver = (e: MouseEvent) => {
    const el = (e.target as Element).closest<HTMLElement>("[data-tip]");
    if (el === anchor) return;
    hide();
    if (!el) return;
    anchor = el;
    timer = setTimeout(() => show(el), DELAY_MS);
  };

  onMount(() => {
    const root = document.documentElement;
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mousedown", hide, true);
    document.addEventListener("scroll", hide, true);
    globalThis.addEventListener("blur", hide);
    root.addEventListener("mouseleave", hide);
    onCleanup(() => {
      hide();
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mousedown", hide, true);
      document.removeEventListener("scroll", hide, true);
      globalThis.removeEventListener("blur", hide);
      root.removeEventListener("mouseleave", hide);
    });
  });

  return (
    <Show when={tip()}>
      {(t) => (
        <Tooltip x={t().x} y={t().y} placement={t().placement}>
          {t().text}
        </Tooltip>
      )}
    </Show>
  );
}
