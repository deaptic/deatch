import { type Accessor, createEffect, createSignal, on } from "solid-js";

const CACHED_WITHIN_MS = 50;

export function createImageReveal(src: Accessor<string | null | undefined>) {
  const [loaded, setLoaded] = createSignal(false);
  const [cached, setCached] = createSignal(false);
  let mountedAt = 0;

  createEffect(
    on(
      src,
      () => {
        setLoaded(false);
        setCached(false);
      },
      { defer: true },
    ),
  );

  return {
    loaded,
    mount: () => {
      mountedAt = performance.now();
    },
    load: () => {
      setCached(performance.now() - mountedAt < CACHED_WITHIN_MS);
      setLoaded(true);
    },
    fade: () =>
      `${cached() ? "" : "transition-opacity duration-quick ease-out"} ${
        loaded() ? "opacity-100" : "opacity-0"
      }`,
  };
}
