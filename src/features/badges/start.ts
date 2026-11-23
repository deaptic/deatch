import { createEffect, createRoot } from "solid-js";
import { selectedChannel } from "../navigation/index.ts";
import * as channels from "../channels/index.ts";
import { forgetChannel, loadChannel } from "./store.ts";

export function start(): () => void {
  const stopHooks = channels.onChannel({ leave: forgetChannel });
  const stopFollowing = createRoot((dispose) => {
    createEffect(() => {
      const broadcaster = selectedChannel();
      if (broadcaster) loadChannel(broadcaster);
    });
    return dispose;
  });
  return () => {
    stopHooks();
    stopFollowing();
  };
}
