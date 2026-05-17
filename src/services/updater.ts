import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export async function checkForUpdates(): Promise<Update | null> {
  try {
    return await check();
  } catch (e) {
    console.error("updater check failed", e);
    return null;
  }
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
