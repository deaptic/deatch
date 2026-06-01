import { invoke } from "@tauri-apps/api/core";
import { invokeCommand } from "./utils";

export async function watchSetMuted(channel: string, muted: boolean): Promise<void> {
  await invokeCommand<void>(
    "watch_set_muted",
    { channel, muted },
    { silent: true },
  );
}

export async function watchRequestState(): Promise<void> {
  try { await invoke<void>("watch_request_state"); } catch {}
}
