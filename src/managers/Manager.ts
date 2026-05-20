import { invoke } from "@tauri-apps/api/core";
import { addToast } from "../state/toasts";

export type InvokeOptions = { silent?: boolean };

// Catches Tauri command failures and surfaces them as error toasts so
// subclasses can read as straight-line code. Returns null on failure.
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
