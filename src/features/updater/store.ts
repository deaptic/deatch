import { createSignal } from "solid-js";
import { relaunchApp } from "../../platform/app.ts";
import { checkForUpdate } from "../../platform/updater.ts";
import { onWindowFocusChanged } from "../../platform/window.ts";
import { exit } from "../exit/index.ts";
import { errorMessage } from "../../shared/error.ts";
import { shouldCheck, type UpdateState } from "./model.ts";

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

const [state, setState] = createSignal<UpdateState>({ kind: "none" });
export { state };

export function start(): () => void {
  let lastCheckedAt = 0;

  async function maybeCheck() {
    if (!shouldCheck(state(), lastCheckedAt, Date.now())) return;
    lastCheckedAt = Date.now();
    const update = await checkForUpdate({ silent: true }).catch(() => null);
    if (update && state().kind === "none") setState({ kind: "ready", update });
  }

  void maybeCheck();
  const interval = setInterval(maybeCheck, CHECK_INTERVAL_MS);
  const unlisten = onWindowFocusChanged(
    (focused) => {
      if (focused) void maybeCheck();
    },
    { silent: true },
  );

  return () => {
    clearInterval(interval);
    unlisten.then((u) => u()).catch(() => {});
  };
}

export async function install(): Promise<void> {
  const current = state();
  if (current.kind !== "ready" && current.kind !== "failed") return;
  const { update } = current;
  setState({ kind: "installing", update });
  try {
    await exit.flush();
    await update.install();
    await relaunchApp({ silent: true });
  } catch (e) {
    setState({ kind: "failed", update, error: errorMessage(e) });
  }
}
