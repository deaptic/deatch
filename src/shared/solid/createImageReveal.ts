import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  on,
} from "solid-js";

const CACHED_WITHIN_MS = 50;

const isReady = (image: HTMLImageElement | undefined) =>
  !!image?.complete && image.naturalWidth > 0;

export function createImageReveal(src: Accessor<string | null | undefined>) {
  const [loaded, setLoaded] = createSignal(false);
  const [cached, setCached] = createSignal(false);
  let image: HTMLImageElement | undefined;
  let shownAt = 0;

  const url = createMemo(src);

  function watch() {
    shownAt = performance.now();
    queueMicrotask(() => {
      if (!isReady(image)) return;
      setCached(true);
      setLoaded(true);
    });
  }

  createEffect(
    on(
      url,
      () => {
        setLoaded(false);
        setCached(false);
        watch();
      },
      { defer: true },
    ),
  );

  return {
    loaded,
    mount: (el: HTMLImageElement) => {
      image = el;
      watch();
    },
    load: () => {
      if (loaded()) return;
      setCached(performance.now() - shownAt < CACHED_WITHIN_MS);
      setLoaded(true);
    },
    fade: () =>
      `${cached() ? "" : "transition-opacity duration-quick ease-out"} ${
        loaded() ? "opacity-100" : "opacity-0"
      }`,
  };
}
