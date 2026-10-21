import { advancedShowLogs } from "../stores/preferences.ts";
import { addToast } from "../stores/toasts.ts";
import { errorMessage } from "../utils/error.ts";
import { t } from "../i18n/index.ts";

export type InvokeOptions = {
  silent?: boolean;
  successMessage?: string | false;
};

export async function invokeCommand<A extends unknown[], T>(
  command: (...args: A) => Promise<T>,
  args: A,
  options: InvokeOptions = {},
): Promise<T> {
  const name = command.name;
  const start = performance.now();
  try {
    const result = await command(...args);
    const ms = Math.round(performance.now() - start);
    console.log(`[cmd] ${name}`, { args, result, ms });
    if (!options.silent) {
      if (options.successMessage) addToast(options.successMessage, "success");
      else if (advancedShowLogs()) addToast(name, "log", summarize(result, ms));
    }
    return result;
  } catch (e) {
    const ms = Math.round(performance.now() - start);
    console.error(`[cmd] ${name} failed`, { args, error: e, ms });
    if (!options.silent) {
      addToast(t("API_ACTION_FAILED"), "error", errorMessage(e));
    }
    throw e;
  }
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
