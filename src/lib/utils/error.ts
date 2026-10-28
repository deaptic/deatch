import { type MessageKey, t } from "../i18n/index.ts";
import type { AppError } from "../types/index.ts";

type GenericKind = Exclude<AppError["kind"], "helix">;

const MESSAGES: Record<GenericKind, MessageKey> = {
  notAuthenticated: "ERROR_NOT_AUTHENTICATED",
  http: "ERROR_NETWORK",
  auth: "ERROR_AUTH",
  missingScope: "ERROR_MISSING_SCOPE",
  discord: "ERROR_DISCORD",
  io: "ERROR_IO",
  invalid: "ERROR_INVALID",
};

function isAppError(e: unknown): e is AppError {
  return typeof e === "object" && e !== null && "kind" in e;
}

/** Twitch's own Helix explanation is shown as-is; other kinds carry
 * technical detail that belongs in the log, not the UI. */
export function errorMessage(e: unknown): string {
  if (!isAppError(e)) return e instanceof Error ? e.message : String(e);
  return e.kind === "helix" ? e.message : t(MESSAGES[e.kind]);
}
