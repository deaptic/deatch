import type { Update } from "../../platform/updater.ts";

export type UpdateState =
  | { kind: "unchecked" }
  | { kind: "checking" }
  | { kind: "current" }
  | { kind: "unreachable" }
  | { kind: "ready"; update: Update }
  | { kind: "installing"; update: Update }
  | { kind: "failed"; update: Update; error: string };

const THROTTLE_MS = 60 * 60 * 1000;

export const canCheck = (state: UpdateState) =>
  state.kind === "unchecked" ||
  state.kind === "current" ||
  state.kind === "unreachable";

export function shouldCheck(
  state: UpdateState,
  lastCheckedAt: number,
  now: number,
): boolean {
  return canCheck(state) && now - lastCheckedAt >= THROTTLE_MS;
}

export const pendingUpdate = (state: UpdateState): Update | null =>
  "update" in state ? state.update : null;
