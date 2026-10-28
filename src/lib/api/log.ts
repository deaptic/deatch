import * as log from "@tauri-apps/plugin-log";
import type { LogLevel } from "../types/index.ts";

/// Calls the plugin directly: invokeCommand reports failures through
/// console.error, which the log service forwards back here.
export function writeLog(level: LogLevel, message: string): Promise<void> {
  return level === "warn" ? log.warn(message) : log.error(message);
}
