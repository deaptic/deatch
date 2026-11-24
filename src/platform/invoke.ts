import { developerShowLogs } from "../features/preferences/index.ts";
import { addToast } from "../kit/toasts.ts";
import { errorMessage } from "../shared/error.ts";
import { listSize } from "../shared/listSize.ts";
import { t } from "../shared/i18n/index.ts";

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
      else if (developerShowLogs())
        addToast(name, "log", summarize(result, ms));
    }
    return result;
  } catch (e) {
    const ms = Math.round(performance.now() - start);
    console.error(`[cmd] ${name} failed`, { error: e, ms });
    if (!options.silent) reportFailure(e, options.failureMessage);
    throw e;
  }
}

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

export function reportFailure(
  error: unknown,
  failureMessage = t("ERROR_ACTION_FAILED_ERROR"),
): void {
  addToast(failureMessage, "error", errorMessage(error));
}

function summarize(result: unknown, ms: number): string {
  const size = listSize(result);
  return size
    ? t("DIAGNOSTICS_LOG_ITEMS_VALUE", { ms, ...size })
    : t("DIAGNOSTICS_LOG_DURATION_VALUE", { ms });
}
