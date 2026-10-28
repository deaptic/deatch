import { createSignal } from "solid-js";
import {
  centeredScrollTop,
  isAtBottom,
  maxScrollTop,
} from "../../lib/utils/feedScroll.ts";

// follow: pinned to the newest message. paused: the user scrolled up.
// jumping: travelling to a message; nothing else may move the view.
type Mode = "follow" | "paused" | "jumping";

type JumpBehavior = "smooth" | "instant";

export function createFeedScroll(scroller: () => HTMLElement | undefined) {
  const [mode, setMode] = createSignal<Mode>("follow");
  // A programmatic scroll echoes one scroll event that must not count as
  // the user scrolling.
  let echo = false;
  // The message at the top of the view while paused, and how far below the
  // view's top it sat, so a resize can put it back.
  let anchor: { item: Element; offset: number } | null = null;
  // The content height last seen; a scroll that comes with a new height was
  // made by layout (the browser clamping after a shrink), not by the user.
  let height = 0;

  function remember(el: HTMLElement) {
    const box = el.getBoundingClientRect();
    // Every element at the point, so a popover over the feed doesn't hide it.
    const item = document
      .elementsFromPoint(box.left + box.width / 2, box.top + 1)
      .find((hit) => el.contains(hit))
      ?.closest("[data-item-id]");
    anchor = item
      ? { item, offset: item.getBoundingClientRect().top - box.top }
      : null;
  }

  // The anchor is taken before the mode changes: a feed may render more or
  // fewer rows per mode, and `restore` puts the view back on it.
  function settle(el: HTMLElement) {
    remember(el);
    setMode(isAtBottom(el) ? "follow" : "paused");
    height = el.scrollHeight;
  }

  function restore() {
    const el = scroller();
    if (!el || !anchor?.item.isConnected) return;
    const shift =
      anchor.item.getBoundingClientRect().top -
      el.getBoundingClientRect().top -
      anchor.offset;
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

  /// Holds the view on the newest message while following, or on the one
  /// being read while paused.
  function keep() {
    if (mode() === "follow") toBottom();
    else if (mode() === "paused") restore();
    height = scroller()?.scrollHeight ?? 0;
  }

  /// Keeps the view in place while the box or `list` change size (spacing,
  /// text size, late images). Returns the cleanup.
  function watch(list: HTMLElement): () => void {
    const el = scroller();
    if (!el) return () => {};
    // The browser's own anchoring would move the view first, and its scroll
    // event would overwrite the remembered message.
    el.style.overflowAnchor = "none";
    const observer = new ResizeObserver(keep);
    observer.observe(el);
    observer.observe(list);
    return () => observer.disconnect();
  }

  function jumpTo(
    item: HTMLElement,
    behavior: JumpBehavior,
    onArrive: () => void,
  ) {
    const el = scroller();
    if (!el) return;
    const itemTop =
      item.getBoundingClientRect().top -
      el.getBoundingClientRect().top +
      el.scrollTop;
    const top = centeredScrollTop(el, itemTop, item.offsetHeight);
    const arrive = () => {
      settle(el);
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

  /// Stops following without moving, before the view is moved by code.
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
