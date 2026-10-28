import * as opener from "@tauri-apps/plugin-opener";
import { invokeCommand, type InvokeOptions } from "./utils.ts";

const commands = {
  openUrl: (url: string) => opener.openUrl(url),
};

export function openUrl(url: string, options?: InvokeOptions): Promise<void> {
  return invokeCommand(commands.openUrl, [url], options);
}
