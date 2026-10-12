import type { AppError } from "../types/index.ts";

function isAppError(e: unknown): e is AppError {
  return typeof e === "object" && e !== null && "kind" in e;
}

export function errorMessage(e: unknown): string {
  if (!isAppError(e)) return e instanceof Error ? e.message : String(e);
  switch (e.kind) {
    case "notAuthenticated":
      return "Not signed in to Twitch";
    default:
      return e.message;
  }
}
