import { createSignal } from "solid-js";
import { relaunchApp } from "../../platform/app.ts";
import { checkForUpdate } from "../../platform/updater.ts";
import { onWindowFocusChanged } from "../../platform/window.ts";
import { exit } from "../exit/index.ts";
import { errorMessage } from "../../shared/error.ts";
import { canCheck, shouldCheck, type UpdateState } from "./model.ts";

const [state, setState] = createSignal<UpdateState>({ kind: "unchecked" });
export { state };

let running: Promise<void> | null = null;

async function checkOnce(): Promise<void> {
  setState({ kind: "checking" });
  try {
    const update = await checkForUpdate({ silent: true });
    setState(update ? { kind: "ready", update } : { kind: "current" });
  } catch {
    setState({ kind: "unreachable" });
  }
}

function run(): Promise<void> {
  running ??= checkOnce().finally(() => {
    running = null;
  });
  return running;
}

export function start(): () => void {
  let lastCheckedAt = 0;

  async function maybeCheck() {
    if (!shouldCheck(state(), lastCheckedAt, Date.now())) return;
    lastCheckedAt = Date.now();
    await run();
  }

  void maybeCheck();
  const unlisten = onWindowFocusChanged(
    (focused) => {
      if (focused) void maybeCheck();
    },
    { silent: true },
  );

  return () => {
    unlisten.then((u) => u()).catch(() => {});
  };
}

export async function check(): Promise<UpdateState> {
  if (running) await running;
  else if (canCheck(state())) await run();
  return state();
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
