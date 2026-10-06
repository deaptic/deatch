import { error, warn } from "@tauri-apps/plugin-log";
import { formatLog } from "../utils/formatLog.ts";

type Write = (message: string) => Promise<void>;

export function start(): () => void {
  const original = { warn: console.warn, error: console.error };

  const forward = (write: Write, args: unknown[]) =>
    write(formatLog(args)).catch((e) =>
      original.error("log forwarding failed", e)
    );

  const onError = (event: ErrorEvent) =>
    forward(error, ["uncaught", event.error ?? event.message]);
  const onRejection = (event: PromiseRejectionEvent) =>
    forward(error, ["unhandled rejection", event.reason]);

  console.warn = (...args: unknown[]) => {
    original.warn(...args);
    void forward(warn, args);
  };
  console.error = (...args: unknown[]) => {
    original.error(...args);
    void forward(error, args);
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
