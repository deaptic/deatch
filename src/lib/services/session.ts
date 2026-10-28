import { setUser } from "../stores/users.ts";
import * as users from "./users.ts";
import * as feedLog from "./feedLog.ts";
import {
  setAuthChecked,
  setDeviceCode,
  setRestoreFailure,
  setWaiting,
} from "../stores/auth.ts";
import { isAppError } from "../utils/error.ts";
import {
  cancelLogin,
  getDeviceCode,
  restoreSession,
  revokeSession,
} from "../api/twitch/auth.ts";

export async function login(): Promise<void> {
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

export async function restore(): Promise<void> {
  const user = await restoreSession({ silent: true }).catch((e: unknown) => {
    if (isAppError(e) && e.kind === "missingScope") {
      setRestoreFailure("missingScope");
    }
    return null;
  });
  if (user) {
    setUser(user);
    users.set([user]);
  }
  setAuthChecked(true);
}
