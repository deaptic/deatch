import * as log from "@tauri-apps/plugin-log";
import type { LogLevel } from "../shared/types/index.ts";

export function writeLog(level: LogLevel, message: string): Promise<void> {
  return level === "warn" ? log.warn(message) : log.error(message);
}
