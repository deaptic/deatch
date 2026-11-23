import { relaunchApp } from "../../platform/app.ts";
import type { InvokeOptions } from "../../platform/invoke.ts";
import { onWindowCloseRequested } from "../../platform/window.ts";
import { feedLog } from "../../features/feed/index.ts";
import * as inbox from "../../features/inbox/index.ts";
import { users } from "../../features/users/index.ts";

export function start(): () => void {
  const flushNow = () => void flush();
  globalThis.addEventListener("pagehide", flushNow);
  const unlisten = onWindowCloseRequested(flush, { silent: true });
  return () => {
    globalThis.removeEventListener("pagehide", flushNow);
    unlisten.then((u) => u()).catch(() => {});
  };
}

export async function flush(): Promise<void> {
  inbox.flush();
  users.flush();
  await feedLog.flush();
}

export async function relaunch(options?: InvokeOptions): Promise<void> {
  await flush();
  await relaunchApp(options);
}
