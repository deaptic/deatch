import { createSignal, onCleanup } from "solid-js";
import {
  centeredScrollTop,
  type FeedMode,
  maxScrollTop,
  modeAfterUserScroll,
} from "../../lib/utils/feedScroll.ts";

type JumpBehavior = "smooth" | "instant";

type Rows = {
  idAt: (y: number) => string | null;
  topOf: (id: string) => number | null;
};

type Anchor = { id: string; offset: number };

const USER_SCROLL_MS = 600;
const USER_INPUT = ["wheel", "touchstart", "keydown"] as const;

export function createFeedScroll(
  scroller: () => HTMLElement | undefined,
  rows: Rows,
  showingLive: () => boolean,
) {
  const [mode, setMode] = createSignal<FeedMode>("follow");
  let anchor: Anchor | null = null;
  let pointerHeld = false;
  let userUntil = 0;
  let cancelJump: (() => void) | null = null;
  onCleanup(() => cancelJump?.());

  const userScrolling = () => pointerHeld || performance.now() < userUntil;
  const markUser = () => (userUntil = performance.now() + USER_SCROLL_MS);

  function remember(el: HTMLElement) {
    const id = rows.idAt(el.scrollTop + 1);
    const top = id === null ? null : rows.topOf(id);
    anchor =
      id !== null && top !== null ? { id, offset: top - el.scrollTop } : null;
  }

  function pin(id: string) {
    const el = scroller();
    const top = rows.topOf(id);
    anchor = el && top !== null ? { id, offset: top - el.scrollTop } : null;
  }

  function restore() {
    const el = scroller();
    if (!el || !anchor) return;
    const top = rows.topOf(anchor.id);
    if (top === null) return;
    const shift = top - el.scrollTop - anchor.offset;
    if (Math.abs(shift) >= 1) el.scrollTop += shift;
  }

  function onScroll(e: Event & { currentTarget: HTMLElement }) {
    if (!userScrolling()) return;
    cancelJump?.();
    const el = e.currentTarget;
    remember(el);
    setMode(modeAfterUserScroll(el, showingLive()));
  }

  function toBottom() {
    const el = scroller();
    anchor = null;
    setMode("follow");
    if (el) el.scrollTop = maxScrollTop(el);
  }

  function keep() {
    if (mode() === "follow") toBottom();
    else restore();
  }

  function read() {
    if (mode() === "reading") return;
    const el = scroller();
    if (el) remember(el);
    setMode("reading");
  }

  function watch(list: HTMLElement): () => void {
    const el = scroller();
    if (!el) return () => {};
    el.style.overflowAnchor = "none";
    const observer = new ResizeObserver(keep);
    observer.observe(el);
    observer.observe(list);
    const press = () => (pointerHeld = true);
    const release = () => {
      if (!pointerHeld) return;
      pointerHeld = false;
      markUser();
    };
    for (const type of USER_INPUT) el.addEventListener(type, markUser);
    el.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    return () => {
      observer.disconnect();
      for (const type of USER_INPUT) el.removeEventListener(type, markUser);
      el.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
    };
  }

  function jumpTo(
    id: string,
    item: HTMLElement,
    behavior: JumpBehavior,
    onArrive: () => void,
  ) {
    const el = scroller();
    if (!el) return;
    cancelJump?.();
    anchor = null;
    setMode("reading");
    const centred = () =>
      centeredScrollTop(
        el,
        item.getBoundingClientRect().top -
          el.getBoundingClientRect().top +
          el.scrollTop,
        item.offsetHeight,
      );
    const arrive = () => {
      cancelJump = null;
      if (item.isConnected) el.scrollTop = centred();
      pin(id);
      onArrive();
    };
    if (behavior === "instant" || Math.abs(centred() - el.scrollTop) < 1) {
      el.scrollTop = centred();
      arrive();
      return;
    }
    el.addEventListener("scrollend", arrive, { once: true });
    cancelJump = () => el.removeEventListener("scrollend", arrive);
    el.scrollTo({ top: centred(), behavior });
  }

  return {
    isPaused: () => mode() === "reading",
    read,
    onScroll,
    toBottom,
    keep,
    watch,
    jumpTo,
  };
}
