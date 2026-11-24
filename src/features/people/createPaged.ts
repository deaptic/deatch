import { createEffect, createSignal, onMount } from "solid-js";

const LOAD_MORE_PX = 400;

type Page<T> = { items: T[]; cursor: string | null; total: number | null };

export function createPaged<T>(
  fetch: (cursor: string | null) => Promise<Page<T>>,
  options: { loadAllWhile?: () => boolean } = {},
) {
  const [items, setItems] = createSignal<T[] | null>(null);
  const [total, setTotal] = createSignal<number | null>(null);
  const [cursor, setCursor] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);
  let failed = false;

  function load(after: string | null) {
    if (loading()) return;
    setLoading(true);
    fetch(after)
      .then((page) => {
        failed = false;
        setItems((list) => [...(after ? (list ?? []) : []), ...page.items]);
        setTotal(page.total);
        setCursor(page.cursor);
      })
      .catch(() => {
        failed = true;
        setItems((list) => list ?? []);
      })
      .finally(() => setLoading(false));
  }

  onMount(() => load(null));

  createEffect(() => {
    const next = cursor();
    if (next && !loading() && !failed && options.loadAllWhile?.()) load(next);
  });

  function nearEnd(e: Event & { currentTarget: HTMLElement }) {
    const el = e.currentTarget;
    const next = cursor();
    if (next && el.scrollHeight - el.scrollTop - el.clientHeight < LOAD_MORE_PX)
      load(next);
  }

  const count = () => {
    const list = items();
    if (!list) return null;
    const known = total();
    return {
      count: known ?? list.length,
      more: known === null && cursor() !== null,
    };
  };

  return { items, setItems, loading, count, nearEnd };
}
