import { setUser, user as signedIn } from "../stores/users.ts";
import * as users from "./users.ts";
import * as feedLog from "./feedLog.ts";
import {
  setAuthChecked,
  setDeviceCode,
  setRestoreFailure,
  setWaiting,
} from "../stores/auth.ts";
import { isAppError } from "../utils/error.ts";
import { createBackoff } from "../utils/backoff.ts";
import {
  cancelLogin,
  getDeviceCode,
  restoreSession,
  revokeSession,
} from "../api/twitch/auth.ts";

const RESTORE_RETRY_MIN_MS = 2_000;
const RESTORE_RETRY_MAX_MS = 60_000;

const restoreRetry = createBackoff(RESTORE_RETRY_MIN_MS, RESTORE_RETRY_MAX_MS);

export function start(): () => void {
  void restore();
  return () => restoreRetry.reset();
}

export async function login(): Promise<void> {
  restoreRetry.reset();
  setRestoreFailure(null);
  setDeviceCode(null);
  setWaiting(true);
  try {
    setDeviceCode(await getDeviceCode());
  } catch {
    setWaiting(false);
  }
}

export function abort(): void {
  setWaiting(false);
  setDeviceCode(null);
  cancelLogin({ silent: true }).catch(() => {});
}

export async function logout(): Promise<void> {
  // The log is the account's own, so what it saw is written while it still
  // is signed in.
  await feedLog.flush();
  // Local logout must win even if Twitch can't be reached; the backend
  // already clears local credentials on its own.
  await revokeSession().catch(() => {});
  setUser(null);
}

async function restore(): Promise<void> {
  if (signedIn()) return;
  try {
    const user = await restoreSession({ silent: true });
    setRestoreFailure(null);
    if (user) {
      setUser(user);
      users.set([user]);
    }
  } catch (e) {
    if (isAppError(e) && e.kind === "missingScope") {
      setRestoreFailure("missingScope");
    } else {
      setRestoreFailure("unreachable");
      restoreRetry.schedule(() => void restore());
    }
  }
  setAuthChecked(true);
}
