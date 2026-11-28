import { writeLog } from "../../platform/log.ts";
import type { LogLevel } from "../../platform/logLevel.ts";
import { formatLog } from "./formatLog.ts";
import { createErrorThrottle } from "./errorThrottle.ts";
import { addToast } from "../../kit/toasts.ts";
import { t } from "../../shared/i18n/index.ts";

const SAME_ERROR_QUIET_MS = 60_000;
const RESIZE_OBSERVER_NOTICE = "ResizeObserver loop";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function start(): () => void {
  const original = { warn: console.warn, error: console.error };

  const forward = (level: LogLevel, args: unknown[]) =>
    writeLog(level, formatLog(args)).catch((e) =>
      original.error("log forwarding failed", e),
    );

  const shouldShow = createErrorThrottle(SAME_ERROR_QUIET_MS);
  const notify = (error: unknown) => {
    const message = messageOf(error);
    if (shouldShow(message, Date.now())) {
      addToast(t("ERROR_UNEXPECTED_TOAST"), "error", message);
    }
  };

  const onError = (event: ErrorEvent) => {
    if (event.message.startsWith(RESIZE_OBSERVER_NOTICE)) return;
    void forward("error", ["uncaught", event.error ?? event.message]);
    notify(event.error ?? event.message);
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    void forward("error", ["unhandled rejection", event.reason]);
    notify(event.reason);
  };

  console.warn = (...args: unknown[]) => {
    original.warn(...args);
    void forward("warn", args);
  };
  console.error = (...args: unknown[]) => {
    original.error(...args);
    void forward("error", args);
  };
  globalThis.addEventListener("error", onError);
  globalThis.addEventListener("unhandledrejection", onRejection);

  return () => {
    console.warn = original.warn;
    console.error = original.error;
    globalThis.removeEventListener("error", onError);
    globalThis.removeEventListener("unhandledrejection", onRejection);
  };
}
