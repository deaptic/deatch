import { createSignal, onCleanup, onMount, Show } from "solid-js";
import Tooltip, { type TooltipPlace } from "./Tooltip.tsx";
import { SIDE_GAP } from "./Popover.tsx";

const DELAY_MS = 300;

type Tip = TooltipPlace & { text: string };

/// Shows `data-tip` on any hovered element after a short delay, in place of
/// the native `title` tooltip. One delegated listener serves the whole app.
export default function TooltipHost() {
  const [tip, setTip] = createSignal<Tip | null>(null);
  let anchor: HTMLElement | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function hide() {
    clearTimeout(timer);
    anchor = null;
    setTip(null);
  }

  function show(el: HTMLElement) {
    const text = el.dataset.tip;
    if (!text || !el.isConnected) return;
    const r = el.getBoundingClientRect();
    setTip({
      text,
      side: "over",
      x: r.left + r.width / 2,
      above: r.top - SIDE_GAP,
      below: r.bottom + SIDE_GAP,
    });
  }

  // Only a scroll that moves the hovered element hides the tip; a feed
  // scrolling in new messages leaves the header's tip alone.
  const onScroll = (e: Event) => {
    if (anchor && (e.target as Node).contains(anchor)) hide();
  };

  function arm(target: Element) {
    const el = target.closest<HTMLElement>("[data-tip]");
    if (el === anchor) return;
    hide();
    if (!el) return;
    anchor = el;
    timer = setTimeout(() => show(el), DELAY_MS);
  }

  const onOver = (e: MouseEvent) => arm(e.target as Element);

  const onFocusIn = (e: FocusEvent) => {
    const el = e.target as Element;
    if (el.matches(":focus-visible")) arm(el);
  };

  onMount(() => {
    const root = document.documentElement;
    document.addEventListener("mouseover", onOver);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", hide);
    document.addEventListener("mousedown", hide, true);
    document.addEventListener("scroll", onScroll, true);
    globalThis.addEventListener("blur", hide);
    root.addEventListener("mouseleave", hide);
    onCleanup(() => {
      hide();
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("mousedown", hide, true);
      document.removeEventListener("scroll", onScroll, true);
      globalThis.removeEventListener("blur", hide);
      root.removeEventListener("mouseleave", hide);
    });
  });

  return (
    <Show when={tip()}>{(t) => <Tooltip {...t()}>{t().text}</Tooltip>}</Show>
  );
}
