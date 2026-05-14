import { invoke } from "@tauri-apps/api/core";
import type { DeviceCode } from "../types";
import type { User } from "../commands/users";
import { addToast } from "../state/toasts";
import { setUser } from "../state/users";
import { setWaiting, setDeviceCode, setAuthChecked } from "../state/auth";

export async function login() {
  try {
    setDeviceCode(null);
    const code = await invoke<DeviceCode>("get_device_code");
    setDeviceCode(code);
    setWaiting(true);
  } catch (e) {
    addToast(String(e), "error");
  }
}

export async function logout() {
  try {
    await invoke("revoke_session");
    setUser(null);
  } catch (e) {
    addToast(String(e), "error");
  }
}

/// Attempts to restore a previously persisted Twitch session on startup.
/// Flips `authChecked` either way so the UI can transition out of the
/// initial "checking…" state.
export async function restoreSession() {
  try {
    const u = await invoke<User>("restore_session");
    setUser(u);
  } catch {
    // No stored session — user will log in manually.
  } finally {
    setAuthChecked(true);
  }
}
