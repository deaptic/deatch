import { createEffect, createRoot } from "solid-js";
import { createDebounced } from "../../shared/solid/createDebounced.ts";
import { commitSelectedChannel, pendingChannel, sameChannel } from "./store.ts";

const CHANNEL_COMMIT_MS = 300;

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
