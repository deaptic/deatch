import { setUser } from "../stores/users.ts";
import * as users from "./users.ts";
import { setAuthChecked, setDeviceCode, setWaiting } from "../stores/auth.ts";
import {
  getDeviceCode,
  restoreSession,
  revokeSession,
} from "../api/twitch/auth.ts";

export async function login(): Promise<void> {
  setDeviceCode(null);
  const code = await getDeviceCode();
  setDeviceCode(code);
  setWaiting(true);
}

export function abort(): void {
  setWaiting(false);
  setDeviceCode(null);
}

export async function logout(): Promise<void> {
  // Local logout must win even if Twitch can't be reached; the backend
  // already clears local credentials on its own.
  await revokeSession().catch(() => {});
  setUser(null);
}

export async function restore(): Promise<void> {
  const user = await restoreSession().catch(() => null);
  if (user) {
    setUser(user);
    users.remember([user]);
  }
  setAuthChecked(true);
}
