import * as autostart from "@tauri-apps/plugin-autostart";
import { invokeCommand, type InvokeOptions } from "./utils.ts";

const commands = {
  isAutostartEnabled: () => autostart.isEnabled(),
  setAutostart: (enabled: boolean) =>
    enabled ? autostart.enable() : autostart.disable(),
};

export function isAutostartEnabled(options?: InvokeOptions): Promise<boolean> {
  return invokeCommand(commands.isAutostartEnabled, [], options);
}

export function setAutostart(
  enabled: boolean,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand(commands.setAutostart, [enabled], options);
}
