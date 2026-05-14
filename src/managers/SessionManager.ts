import type { DeviceCode } from "../types";
import type { User } from "../commands/users";
import { setUser } from "../state/users";
import { setWaiting, setDeviceCode, setAuthChecked } from "../state/auth";
import { Manager } from "./Manager";

/// Orchestrates the Twitch device-code login flow, session restore, and
/// logout. Mutates the auth and user state stores; never holds its own
/// state. Use the exported `sessionManager` singleton; the class is
/// exported for tests.
export class SessionManager extends Manager {
  /// Starts the device-code flow. On success, `deviceCode` and `waiting`
  /// are populated and the UI shows the activation screen. The actual
  /// `setUser` happens later, from the `twitch-auth-success` listener in
  /// `events/auth.ts` once Twitch confirms the code.
  public async login(): Promise<void> {
    setDeviceCode(null);
    const code = await this.invokeCommand<DeviceCode>("get_device_code");
    if (!code) return;
    setDeviceCode(code);
    setWaiting(true);
  }

  /// Aborts an in-progress device-code login flow. Pure state reset —
  /// no Twitch round-trip; the backend will let the device code expire
  /// on its own.
  public abort(): void {
    setWaiting(false);
    setDeviceCode(null);
  }

  /// Revokes the persisted Twitch session and clears the user signal.
  public async logout(): Promise<void> {
    const result = await this.invokeCommand<void>("revoke_session");
    if (result === null) return;
    setUser(null);
  }

  /// Attempts to restore a previously persisted Twitch session on startup.
  /// Silent — a missing session is normal, not an error worth toasting.
  /// Flips `authChecked` either way so the UI can transition out of the
  /// initial "checking…" state.
  public async restore(): Promise<void> {
    const u = await this.invokeCommand<User>("restore_session", undefined, { silent: true });
    if (u) setUser(u);
    setAuthChecked(true);
  }
}

export const sessionManager = new SessionManager();
