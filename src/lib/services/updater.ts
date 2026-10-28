import { relaunchApp } from "../api/app.ts";
import { checkForUpdate } from "../api/updater.ts";
import { onWindowFocusChanged } from "../api/window.ts";
import type { Update } from "../types/index.ts";
import {
  installing,
  pendingUpdate,
  setPendingUpdate,
} from "../stores/updater.ts";

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const THROTTLE_MS = 60 * 60 * 1000;

export function start(): () => void {
  let lastCheckedAt = 0;

  async function maybeCheck() {
    if (pendingUpdate() || installing()) return;
    if (Date.now() - lastCheckedAt < THROTTLE_MS) return;
    lastCheckedAt = Date.now();
    const update = await checkForUpdate({ silent: true }).catch(() => null);
    if (update && !pendingUpdate()) setPendingUpdate(update);
  }

  void maybeCheck();
  const interval = window.setInterval(maybeCheck, CHECK_INTERVAL_MS);
  const unlisten = onWindowFocusChanged(
    (focused) => {
      if (focused) void maybeCheck();
    },
    { silent: true },
  );

  return () => {
    window.clearInterval(interval);
    void unlisten.then((u) => u());
  };
}

export async function install(update: Update): Promise<void> {
  await update.install();
  await relaunchApp({ silent: true });
}
