import { relaunchApp } from "../api/app.ts";
import { checkForUpdate } from "../api/updater.ts";
import { onWindowFocusChanged } from "../api/window.ts";
import * as exit from "./exit.ts";
import {
  installing,
  pendingUpdate,
  setInstallError,
  setInstalling,
  setPendingUpdate,
} from "../stores/updater.ts";
import { errorMessage } from "../utils/error.ts";

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
  const interval = setInterval(maybeCheck, CHECK_INTERVAL_MS);
  const unlisten = onWindowFocusChanged(
    (focused) => {
      if (focused) void maybeCheck();
    },
    { silent: true },
  );

  return () => {
    clearInterval(interval);
    unlisten.then((u) => u()).catch(() => {});
  };
}

export async function install(): Promise<void> {
  const update = pendingUpdate();
  if (!update || installing()) return;
  setInstallError(null);
  setInstalling(true);
  try {
    await exit.flush();
    await update.install();
    await relaunchApp({ silent: true });
  } catch (e) {
    setInstallError(errorMessage(e));
    setInstalling(false);
  }
}
