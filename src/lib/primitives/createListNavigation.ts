import { createEffect, createSignal, on } from "solid-js";

/// Steps through `count` rows, wrapping past either end.
export function wrapIndex(index: number, step: number, count: number): number {
  return count === 0 ? 0 : (((index + step) % count) + count) % count;
}

/// The one way a list is driven from the keyboard: a single active row that
/// arrows move (wrapping at the ends) and hover sets, kept in range as the
/// list shrinks and scrolled into view as it moves.
export function createListNavigation(opts: {
  count: () => number;
  rowAt: (index: number) => Element | null | undefined;
}) {
  const [active, setActive] = createSignal(0);

  createEffect(() => {
    const last = Math.max(0, opts.count() - 1);
    setActive((i) => Math.min(i, last));
  });

  createEffect(on(active, (i) => {
    queueMicrotask(() => opts.rowAt(i)?.scrollIntoView({ block: "nearest" }));
  }));

  return {
    active,
    setActive,
    move: (step: number) => {
      setActive((i) => wrapIndex(i, step, opts.count()));
    },
  };
}
