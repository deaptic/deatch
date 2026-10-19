import { createSignal, onCleanup, onMount, Show } from "solid-js";
import Tooltip from "./Tooltip.tsx";
import { SIDE_GAP } from "./Popover.tsx";

const DELAY_MS = 300;
/// Below this much room above the element the tip opens beneath it instead.
const ROOM_ABOVE = 64;
/// Wider elements (a stream title, a header line) anchor the tip at the
/// pointer, since their centre can be far from it.
const CENTRED_UP_TO = 120;

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
  let pointerX = 0;

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
      x: r.width <= CENTRED_UP_TO ? r.left + r.width / 2 : pointerX,
      y: above ? r.top - SIDE_GAP : r.bottom + SIDE_GAP,
      placement: above ? "above" : "below",
    });
  }

  // Only a scroll that moves the hovered element hides the tip; a feed
  // scrolling in new messages leaves the header's tip alone.
  const onScroll = (e: Event) => {
    if (anchor && (e.target as Node).contains(anchor)) hide();
  };

  const onMove = (e: MouseEvent) => {
    pointerX = e.clientX;
  };

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
    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mousedown", hide, true);
    document.addEventListener("scroll", onScroll, true);
    globalThis.addEventListener("blur", hide);
    root.addEventListener("mouseleave", hide);
    onCleanup(() => {
      hide();
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", hide, true);
      document.removeEventListener("scroll", onScroll, true);
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
