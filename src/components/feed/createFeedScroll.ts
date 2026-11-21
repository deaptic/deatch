import { createSignal } from "solid-js";
import {
  centeredScrollTop,
  isAtBottom,
  maxScrollTop,
} from "../../lib/utils/feedScroll.ts";

type Mode = "follow" | "paused" | "jumping";

type JumpBehavior = "smooth" | "instant";

type Rows = {
  idAt: (y: number) => string | null;
  topOf: (id: string) => number | null;
};

export function createFeedScroll(
  scroller: () => HTMLElement | undefined,
  rows: Rows,
) {
  const [mode, setMode] = createSignal<Mode>("follow");
  let echo = false;
  let anchor: { id: string; offset: number } | null = null;
  let height = 0;

  function remember(el: HTMLElement) {
    const id = rows.idAt(el.scrollTop + 1);
    const top = id === null ? null : rows.topOf(id);
    anchor =
      id !== null && top !== null ? { id, offset: top - el.scrollTop } : null;
  }

  function settle(el: HTMLElement) {
    remember(el);
    setMode(isAtBottom(el) ? "follow" : "paused");
    height = el.scrollHeight;
  }

  function restore() {
    const el = scroller();
    if (!el || !anchor) return;
    const top = rows.topOf(anchor.id);
    if (top === null) return;
    const shift = top - el.scrollTop - anchor.offset;
    if (Math.abs(shift) < 1) return;
    const before = el.scrollTop;
    el.scrollTop += shift;
    echo = el.scrollTop !== before;
  }

  function onScroll(e: Event & { currentTarget: HTMLElement }) {
    if (echo) {
      echo = false;
      return;
    }
    if (mode() === "jumping") return;
    const el = e.currentTarget;
    if (el.scrollHeight !== height) keep();
    else settle(el);
  }

  function toBottom() {
    const el = scroller();
    if (!el) return;
    const top = maxScrollTop(el);
    if (top !== el.scrollTop) {
      echo = true;
      el.scrollTo({ top, behavior: "instant" });
    }
    setMode("follow");
  }

  function keep() {
    if (mode() === "follow") toBottom();
    else if (mode() === "paused") restore();
    height = scroller()?.scrollHeight ?? 0;
  }

  function watch(list: HTMLElement): () => void {
    const el = scroller();
    if (!el) return () => {};
    el.style.overflowAnchor = "none";
    const observer = new ResizeObserver(keep);
    observer.observe(el);
    observer.observe(list);
    return () => observer.disconnect();
  }

  function jumpTo(
    id: string,
    item: HTMLElement,
    behavior: JumpBehavior,
    onArrive: () => void,
  ) {
    const el = scroller();
    if (!el) return;
    const centred = () =>
      centeredScrollTop(
        el,
        item.getBoundingClientRect().top -
          el.getBoundingClientRect().top +
          el.scrollTop,
        item.offsetHeight,
      );
    const top = centred();
    const arrive = () => {
      if (item.isConnected) {
        const before = el.scrollTop;
        el.scrollTop = centred();
        if (el.scrollTop !== before) echo = true;
      }
      settle(el);
      const at = rows.topOf(id);
      if (mode() === "paused" && at !== null) {
        anchor = { id, offset: at - el.scrollTop };
      }
      onArrive();
    };
    if (Math.abs(top - el.scrollTop) < 1) {
      arrive();
      return;
    }
    if (behavior === "instant") {
      echo = true;
      el.scrollTo({ top, behavior });
      arrive();
      return;
    }
    setMode("jumping");
    el.addEventListener("scrollend", arrive, { once: true });
    el.scrollTo({ top, behavior });
  }

  function pause() {
    if (mode() === "follow") setMode("paused");
  }

  return {
    isPaused: () => mode() !== "follow",
    pause,
    onScroll,
    toBottom,
    keep,
    watch,
    jumpTo,
  };
}
