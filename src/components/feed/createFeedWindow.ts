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

  // Observers only record; the re-render they cause waits for the next frame,
  // or it would resize what they observe while they are still delivering.
  let frame: number | null = null;
  let remeasured = false;
  function later() {
    frame ??= requestAnimationFrame(() => {
      frame = null;
      if (remeasured) {
        remeasured = false;
        setVersion((v) => v + 1);
      }
      sync();
    });
  }

  const rows = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const id = (entry.target as HTMLElement).dataset.rowId;
      const height = entry.borderBoxSize[0]?.blockSize;
      if (id === undefined || height === undefined) continue;
      if (measured.get(id) === height) continue;
      measured.set(id, height);
      remeasured = true;
    }
    if (remeasured) later();
  });
  onCleanup(() => {
    rows.disconnect();
    if (frame !== null) cancelAnimationFrame(frame);
  });

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

  /// Where the list starts in the scroller's content.
  function listTop(el: HTMLElement, list: HTMLElement): number {
    return (
      list.getBoundingClientRect().top -
      el.getBoundingClientRect().top +
      el.scrollTop
    );
  }

  /// Reads the scroll position and view size; call on every scroll.
  function sync() {
    const el = opts.scroller();
    const list = opts.list();
    if (!el || !list) return;
    setTop(el.scrollTop - listTop(el, list));
    setViewport(el.clientHeight);
  }

  /// Follows the view size. Returns the cleanup.
  function watch(): () => void {
    const el = opts.scroller();
    if (!el) return () => {};
    const observer = new ResizeObserver(later);
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

  /// Where row `id` starts in the scroller's content: read from the row when
  /// it is rendered, else summed from the heights; null for an unknown id.
  function topOf(id: string): number | null {
    const el = opts.scroller();
    const list = opts.list();
    if (!el || !list) return null;
    const row = list.querySelector(`[data-row-id="${CSS.escape(id)}"]`);
    if (row) {
      return (
        row.getBoundingClientRect().top -
        el.getBoundingClientRect().top +
        el.scrollTop
      );
    }
    const i = opts.ids().indexOf(id);
    return i < 0 ? null : listTop(el, list) + offsetOf(heights(), i);
  }

  /// The row at `y` in the scroller's content, rendered or not.
  function idAt(y: number): string | null {
    const el = opts.scroller();
    const list = opts.list();
    if (!el || !list) return null;
    const { start } = windowAt(heights(), y - listTop(el, list), 0);
    return opts.ids()[start] ?? null;
  }

  /// Scrolls so row `id` is centred and therefore rendered. Only for a feed
  /// that is not following, whose window follows the scroll position.
  function reveal(id: string) {
    const el = opts.scroller();
    const rowTop = topOf(id);
    if (!el || rowTop === null) return;
    const i = opts.ids().indexOf(id);
    const height = heights()[i] ?? 0;
    el.scrollTop = rowTop - (el.clientHeight - height) / 2;
    sync();
  }

  return { range, sync, watch, measure, isRendered, topOf, idAt, reveal };
}
