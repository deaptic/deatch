import { createMemo, createSignal, onCleanup } from "solid-js";
import {
  type FeedWindow,
  offsetOf,
  windowAt,
  windowFromEnd,
} from "../../lib/utils/feedWindow.ts";

// Rows rendered past each edge of the view, so a scroll or a late image
// rarely shows the space of a row not yet built.
const OVERSCAN_PX = 400;
// The height assumed for rows before any has been measured.
const FIRST_GUESS_PX = 32;

type Options = {
  ids: () => string[];
  scroller: () => HTMLElement | undefined;
  list: () => HTMLElement | undefined;
  /// Pinned to the newest row: the window is filled from the end.
  following: () => boolean;
};

/// Renders only the rows in view. Rows are measured as they render; the rest
/// are sized from the average, and the anchor in createFeedScroll absorbs the
/// difference once they are measured.
export function createFeedWindow(opts: Options) {
  const measured = new Map<string, number>();
  const [version, setVersion] = createSignal(0);
  const [top, setTop] = createSignal(0);
  const [viewport, setViewport] = createSignal(0);

  const rows = new ResizeObserver((entries) => {
    let changed = false;
    for (const entry of entries) {
      const id = (entry.target as HTMLElement).dataset.rowId;
      const height = entry.borderBoxSize[0]?.blockSize;
      if (id === undefined || height === undefined) continue;
      if (measured.get(id) === height) continue;
      measured.set(id, height);
      changed = true;
    }
    if (changed) setVersion((v) => v + 1);
  });
  onCleanup(() => rows.disconnect());

  function estimate(): number {
    let total = 0;
    let count = 0;
    for (const height of measured.values()) {
      if (height === 0) continue;
      total += height;
      count++;
    }
    return count > 0 ? total / count : FIRST_GUESS_PX;
  }

  const heights = createMemo(() => {
    version();
    const ids = opts.ids();
    if (measured.size > ids.length * 2) {
      const live = new Set(ids);
      for (const id of measured.keys()) if (!live.has(id)) measured.delete(id);
    }
    const guess = estimate();
    return ids.map((id) => measured.get(id) ?? guess);
  });

  const range = createMemo<FeedWindow>(() => {
    const span = viewport() + OVERSCAN_PX;
    if (opts.following()) return windowFromEnd(heights(), span);
    return windowAt(heights(), top() - OVERSCAN_PX, top() + span);
  });

  /// Reads the scroll position and view size; call on every scroll.
  function sync() {
    const el = opts.scroller();
    const list = opts.list();
    if (!el || !list) return;
    setTop(el.scrollTop - list.offsetTop);
    setViewport(el.clientHeight);
  }

  /// Follows the view size. Returns the cleanup.
  function watch(): () => void {
    const el = opts.scroller();
    if (!el) return () => {};
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    sync();
    return () => observer.disconnect();
  }

  /// Measures a rendered row for as long as it stays rendered.
  function measure(el: HTMLElement) {
    rows.observe(el);
    onCleanup(() => rows.unobserve(el));
  }

  function isRendered(id: string): boolean {
    const i = opts.ids().indexOf(id);
    const { start: from, end } = range();
    return i >= from && i < end;
  }

  /// Scrolls so row `id` is centred and therefore rendered. Only for a feed
  /// that is not following, whose window follows the scroll position.
  function reveal(id: string) {
    const i = opts.ids().indexOf(id);
    const el = opts.scroller();
    const list = opts.list();
    if (i < 0 || !el || !list) return;
    const h = heights();
    const rowTop = list.offsetTop + offsetOf(h, i);
    el.scrollTop = rowTop - (el.clientHeight - (h[i] ?? 0)) / 2;
    sync();
  }

  return { range, sync, watch, measure, isRendered, reveal };
}
