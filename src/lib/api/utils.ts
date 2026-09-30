import { invoke } from "@tauri-apps/api/core";
import { advancedShowLogs } from "../stores/preferences.ts";
import { addToast } from "../stores/toasts.ts";
import { errorMessage } from "../utils/error.ts";

export type { PaginatedResponse } from "../types/pagination.ts";

export type InvokeOptions = { silent?: boolean; successMessage?: string };

export async function invokeCommand<T>(
  cmd: string,
  params?: Record<string, unknown>,
  options: InvokeOptions = {},
): Promise<T> {
  const start = performance.now();
  try {
    const result = await invoke<T>(
      cmd,
      params === undefined ? undefined : { params },
    );
    const ms = Math.round(performance.now() - start);
    console.log(`[cmd] ${cmd}`, { params, result, ms });
    if (!options.silent) {
      if (options.successMessage) addToast(options.successMessage, "success");
      else if (advancedShowLogs()) addToast(cmd, "log", summarize(result, ms));
    }
    return result;
  } catch (e) {
    const ms = Math.round(performance.now() - start);
    console.error(`[cmd] ${cmd} failed`, { params, error: e, ms });
    if (!options.silent) {
      addToast(`${humanizeCommand(cmd)} failed`, "error", errorMessage(e));
    }
    throw e;
  }
}

function humanizeCommand(cmd: string): string {
  const spaced = cmd.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function summarize(result: unknown, ms: number): string {
  if (Array.isArray(result)) return `${ms}ms · ${result.length} items`;
  if (
    result !== null &&
    typeof result === "object" &&
    Array.isArray((result as { data?: unknown }).data)
  ) {
    const data =
      (result as { data: unknown[]; pagination?: { cursor: string | null } })
        .data;
    const more = (result as { pagination?: { cursor: string | null } })
      .pagination?.cursor;
    return `${ms}ms · ${data.length} items${more ? " · more…" : ""}`;
  }
  return `${ms}ms`;
}
