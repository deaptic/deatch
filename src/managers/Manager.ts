import { invoke } from "@tauri-apps/api/core";
import { addToast } from "../state/toasts";

export type InvokeOptions = { silent?: boolean };

/// Base class for managers. Provides a thin `invokeCommand` helper that
/// catches Tauri command failures and surfaces them as error toasts, so
/// subclass methods can read as straight-line code.
///
/// Resolves to the command's value on success, or `null` on failure.
/// Subclasses check the return for null when they need to short-circuit;
/// the toast has already fired. Pass `silent: true` to suppress the toast
/// (e.g. for startup probes like `restore_session`).
export abstract class Manager {
  protected async invokeCommand<T>(
    cmd: string,
    params?: Record<string, unknown>,
    options: InvokeOptions = {},
  ): Promise<T | null> {
    try {
      return await invoke<T>(cmd, params);
    } catch (e) {
      if (!options.silent) addToast(String(e), "error");
      return null;
    }
  }
}
