import { advancedShowLogs } from "../stores/preferences.ts";
import { addToast } from "../stores/toasts.ts";
import { errorMessage } from "../utils/error.ts";
import { listSize } from "../utils/listSize.ts";
import { t } from "../i18n/index.ts";

export type InvokeOptions = {
  silent?: boolean;
  successMessage?: string | false;
  failureMessage?: string;
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
    if (!options.silent) {
      if (options.successMessage) addToast(options.successMessage, "success");
      else if (advancedShowLogs()) addToast(name, "log", summarize(result, ms));
    }
    return result;
  } catch (e) {
    const ms = Math.round(performance.now() - start);
    console.error(`[cmd] ${name} failed`, { error: e, ms });
    if (!options.silent) reportFailure(e, options.failureMessage);
    throw e;
  }
}

/// Tauri's unlisten is a backend call too, typed as returning nothing; this
/// one goes through invokeCommand and never rejects, since nothing awaits it.
export function wrapUnlisten(unlisten: () => unknown): () => void {
  const commands = {
    unlisten: async () => {
      await unlisten();
    },
  };
  return () => {
    invokeCommand(commands.unlisten, [], { silent: true }).catch(() => {});
  };
}

/// Toasts a failure the way invokeCommand does, for callers that made the
/// call silently on the user's behalf (a shared batch, say).
export function reportFailure(
  error: unknown,
  failureMessage = t("API_ACTION_FAILED"),
): void {
  addToast(failureMessage, "error", errorMessage(error));
}

function summarize(result: unknown, ms: number): string {
  const size = listSize(result);
  return size
    ? t("API_LOG_ITEMS", { ms, ...size })
    : t("API_LOG_DURATION", { ms });
}
