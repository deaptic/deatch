import { check } from "@tauri-apps/plugin-updater";
import type { Update } from "../types/index.ts";
import { invokeCommand, type InvokeOptions } from "./utils.ts";

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
