import { check } from "@tauri-apps/plugin-updater";
import { invokeCommand, type InvokeOptions } from "./invoke.ts";

export type Update = {
  version: string;
  install: () => Promise<void>;
};

const commands = {
  checkForUpdate: () => check(),
};

export async function checkForUpdate(
  options?: InvokeOptions,
): Promise<Update | null> {
  const update = await invokeCommand(commands.checkForUpdate, [], options);
  if (!update) return null;
  const install = { installUpdate: () => update.downloadAndInstall() };
  return {
    version: update.version,
    install: () => invokeCommand(install.installUpdate, [], { silent: true }),
  };
}
