import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { pendingUpdate, setPendingUpdate, installing } from "../stores/updater";

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const THROTTLE_MS = 60 * 60 * 1000;

export function startUpdateChecker(): () => void {
  let lastCheckedAt = 0;

  async function maybeCheck() {
    if (pendingUpdate() || installing()) return;
    if (Date.now() - lastCheckedAt < THROTTLE_MS) return;
    lastCheckedAt = Date.now();
    const update = await check().catch(() => null);
    if (update && !pendingUpdate()) setPendingUpdate(update);
  }

  void maybeCheck();
  const interval = window.setInterval(maybeCheck, CHECK_INTERVAL_MS);
  const unlisten = getCurrentWindow().onFocusChanged(
    ({ payload }) => { if (payload) void maybeCheck(); },
  );

  return () => {
    window.clearInterval(interval);
    void unlisten.then((u) => u());
  };
}

export async function installUpdate(update: Update): Promise<void> {
  await update.downloadAndInstall();
  await relaunch();
}
