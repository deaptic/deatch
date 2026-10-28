import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { invokeCommand, type InvokeOptions } from "./utils.ts";

const commands = {
  appVersion: () => getVersion(),
  relaunchApp: () => relaunch(),
};

export function appVersion(options?: InvokeOptions): Promise<string> {
  return invokeCommand(commands.appVersion, [], options);
}

export function relaunchApp(options?: InvokeOptions): Promise<void> {
  return invokeCommand(commands.relaunchApp, [], options);
}
