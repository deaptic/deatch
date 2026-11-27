import { relaunchApp } from "../../platform/app.ts";
import type { InvokeOptions } from "../../platform/invoke.ts";
import {
  type CloseAction,
  destroyWindow,
  onWindowCloseRequested,
} from "../../platform/window.ts";
import { feedLog } from "../feed/index.ts";
import * as inbox from "../inbox/index.ts";
import { systemCloseToTray } from "../preferences/index.ts";
import { users } from "../users/index.ts";

export function start(): () => void {
  const flushNow = () => void flush();
  globalThis.addEventListener("pagehide", flushNow);
  const unlisten = onWindowCloseRequested(closeAction, { silent: true });
  return () => {
    globalThis.removeEventListener("pagehide", flushNow);
    unlisten.then((u) => u()).catch(() => {});
  };
}

async function closeAction(): Promise<CloseAction> {
  if (systemCloseToTray()) return "hide";
  await flush();
  return "close";
}

export async function quit(): Promise<void> {
  await flush();
  await destroyWindow();
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
