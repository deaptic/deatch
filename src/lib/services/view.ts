import { createEffect, createRoot } from "solid-js";
import { createDebounced } from "../primitives/createDebounced.ts";
import {
  commitSelectedChannel,
  pendingChannel,
  sameChannel,
} from "../stores/view.ts";

const CHANNEL_COMMIT_MS = 300;

/// Stepping through channels commits only where it stops, so the ones passed
/// on the way never load; opening or leaving a page commits at once.
export function start(): () => void {
  return createRoot((dispose) => {
    const settled = createDebounced(pendingChannel, CHANNEL_COMMIT_MS, {
      equals: sameChannel,
      immediate: (next, current) => next === null || current === null,
    });
    createEffect(() => commitSelectedChannel(settled()));
    return dispose;
  });
}
