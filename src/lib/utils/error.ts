import { type MessageKey, t } from "../../shared/i18n/index.ts";
import type { AppError } from "../types/index.ts";

type GenericKind = Exclude<AppError["kind"], "helix">;

const MESSAGES: Record<GenericKind, MessageKey> = {
  notAuthenticated: "ERROR_NOT_AUTHENTICATED_ERROR",
  http: "ERROR_NETWORK_ERROR",
  auth: "ERROR_AUTH_ERROR",
  missingScope: "ERROR_MISSING_SCOPE_ERROR",
  discord: "ERROR_DISCORD_ERROR",
  io: "ERROR_IO_ERROR",
  invalid: "ERROR_INVALID_RESPONSE_ERROR",
};

export function isAppError(e: unknown): e is AppError {
  return typeof e === "object" && e !== null && "kind" in e;
}

export function errorMessage(e: unknown): string {
  if (!isAppError(e)) return e instanceof Error ? e.message : String(e);
  return e.kind === "helix" ? e.message : t(MESSAGES[e.kind]);
}
