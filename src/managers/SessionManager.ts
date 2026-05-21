import { setUser } from "../state/users";
import { setWaiting, setDeviceCode, setAuthChecked } from "../state/auth";
import { getDeviceCode, revokeSession, restoreSession } from "../commands/session";
import { Manager } from "./Manager";

export class SessionManager extends Manager {
  public async login(): Promise<void> {
    setDeviceCode(null);
    const code = await getDeviceCode();
    setDeviceCode(code);
    setWaiting(true);
  }

  public abort(): void {
    setWaiting(false);
    setDeviceCode(null);
  }

  public async logout(): Promise<void> {
    try {
      await revokeSession();
    } catch {}
    setUser(null);
  }

  public async restore(): Promise<void> {
    try {
      const user = await restoreSession();
      if (user) setUser(user);
    } catch {}
    setAuthChecked(true);
  }
}

export const sessionManager = new SessionManager();
