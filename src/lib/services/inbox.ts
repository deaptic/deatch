import { createEffect } from "solid-js";
import { mentions, pruneExpired } from "../stores/inbox.ts";
import { msUntilNextExpiry } from "../stores/inboxRetention.ts";

export function start(): () => void {
  let timer: number | undefined;
  createEffect(() => {
    clearTimeout(timer);
    const delay = msUntilNextExpiry(mentions(), Date.now());
    if (delay !== null) timer = window.setTimeout(pruneExpired, delay);
  });
  return () => clearTimeout(timer);
}
