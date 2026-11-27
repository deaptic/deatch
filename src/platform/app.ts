import { getName, getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { invokeCommand, type InvokeOptions } from "./invoke.ts";

export type AppInfo = { name: string; version: string };

const commands = {
  appInfo: async (): Promise<AppInfo> => {
    const [name, version] = await Promise.all([getName(), getVersion()]);
    return { name, version };
  },
  relaunchApp: () => relaunch(),
};

export function appInfo(options?: InvokeOptions): Promise<AppInfo> {
  return invokeCommand(commands.appInfo, [], options);
}

export function relaunchApp(options?: InvokeOptions): Promise<void> {
  return invokeCommand(commands.relaunchApp, [], options);
}
