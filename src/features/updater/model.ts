import type { Update } from "../../platform/updater.ts";

export type UpdateState =
  | { kind: "none" }
  | { kind: "ready"; update: Update }
  | { kind: "installing"; update: Update }
  | { kind: "failed"; update: Update; error: string };

const THROTTLE_MS = 60 * 60 * 1000;

export function shouldCheck(
  state: UpdateState,
  lastCheckedAt: number,
  now: number,
): boolean {
  return state.kind === "none" && now - lastCheckedAt >= THROTTLE_MS;
}
