import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { pendingUpdate, setPendingUpdate, installing } from "../state/updater";

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const THROTTLE_MS = 60 * 60 * 1000;

export async function checkForUpdates(): Promise<Update | null> {
  try {
    return await check();
  } catch (e) {
    console.error("updater check failed", e);
    return null;
  }
}

export function startUpdateChecker(): () => void {
  let lastCheckedAt = 0;

  async function maybeCheck() {
    if (pendingUpdate() || installing()) return;
    if (Date.now() - lastCheckedAt < THROTTLE_MS) return;
    lastCheckedAt = Date.now();
    const update = await checkForUpdates();
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
  let downloaded = 0;
  let total = 0;
  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case "Started":
        total = event.data.contentLength ?? 0;
        break;
      case "Progress":
        downloaded += event.data.chunkLength;
        console.log(`update download ${downloaded}/${total}`);
        break;
      case "Finished":
        console.log("update download finished");
        break;
    }
  });
  await relaunch();
}
