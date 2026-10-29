import { relaunchApp } from "../api/app.ts";
import type { InvokeOptions } from "../api/utils.ts";
import { onWindowCloseRequested } from "../api/window.ts";
import * as feedLog from "./feedLog.ts";
import * as inbox from "./inbox.ts";
import * as users from "./users.ts";

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
