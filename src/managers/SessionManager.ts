import type { DeviceCode } from "../types";
import type { User } from "../commands/users";
import { setUser } from "../state/users";
import { setWaiting, setDeviceCode, setAuthChecked } from "../state/auth";
import { Manager } from "./Manager";

export class SessionManager extends Manager {
  public async login(): Promise<void> {
    setDeviceCode(null);
    const code = await this.invokeCommand<DeviceCode>("get_device_code");
    if (!code) return;
    setDeviceCode(code);
    setWaiting(true);
  }

  public abort(): void {
    setWaiting(false);
    setDeviceCode(null);
  }

  public async logout(): Promise<void> {
    await this.invokeCommand<void>("revoke_session");
    setUser(null);
  }

  public async restore(): Promise<void> {
    const user = await this.invokeCommand<User | null>("restore_session");
    if (user) setUser(user);
    setAuthChecked(true);
  }
}

export const sessionManager = new SessionManager();
