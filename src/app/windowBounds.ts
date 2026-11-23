import { createEffect, createRoot, createSignal, on } from "solid-js";
import { isWindowMaximized, onWindowResized } from "../platform/window.ts";
import { createDebounced } from "../shared/solid/createDebounced.ts";
import { setWindowMaximized } from "../platform/windowState.ts";

const RESIZE_SETTLE_MS = 100;

export function start(): () => void {
  const unlisten = createRoot((dispose) => {
    const [resizes, setResizes] = createSignal(0);
    const settled = createDebounced(resizes, RESIZE_SETTLE_MS);
    createEffect(
      on(settled, () => {
        isWindowMaximized({ silent: true })
          .then(setWindowMaximized)
          .catch(() => {});
      }),
    );
    const listener = onWindowResized(() => setResizes((n) => n + 1), {
      silent: true,
    });
    return () => {
      dispose();
      listener.then((off) => off()).catch(() => {});
    };
  });
  return unlisten;
}
