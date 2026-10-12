import { createSignal } from "solid-js";
import { centeredScrollTop, isAtBottom, maxScrollTop } from "./feedScroll.ts";

// follow: pinned to the newest message. paused: the user scrolled up.
// jumping: travelling to a message; nothing else may move the view.
type Mode = "follow" | "paused" | "jumping";

export type JumpBehavior = "smooth" | "instant";

export function createFeedScroll(scroller: () => HTMLElement | undefined) {
  const [mode, setMode] = createSignal<Mode>("follow");
  // A programmatic scroll echoes one scroll event that must not count as
  // the user scrolling.
  let echo = false;

  const settle = (el: HTMLElement) =>
    setMode(isAtBottom(el) ? "follow" : "paused");

  function onScroll(e: Event) {
    if (echo) {
      echo = false;
      return;
    }
    if (mode() === "jumping") return;
    settle(e.currentTarget as HTMLElement);
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

  function follow() {
    if (mode() === "follow") toBottom();
  }

  function jumpTo(
    item: HTMLElement,
    behavior: JumpBehavior,
    onArrive: () => void,
  ) {
    const el = scroller();
    if (!el) return;
    const itemTop = item.getBoundingClientRect().top -
      el.getBoundingClientRect().top + el.scrollTop;
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

  return {
    isPaused: () => mode() !== "follow",
    onScroll,
    toBottom,
    follow,
    jumpTo,
  };
}
