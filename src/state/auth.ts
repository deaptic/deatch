import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { addToast } from "./toasts";
import { setUser } from "./users";
import type { DeviceCode } from "../types";
import type { User } from "../commands/users";

const [waiting, setWaiting] = createSignal(false);
const [deviceCode, setDeviceCode] = createSignal<DeviceCode | null>(null);
const [authChecked, setAuthChecked] = createSignal(false);
export { waiting, deviceCode, authChecked };

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

export function cancel() {
  setWaiting(false);
  setDeviceCode(null);
}

export async function logout() {
  try {
    await invoke("revoke_session");
    setUser(null);
  } catch (e) {
    addToast(String(e), "error");
  }
}

(async () => {
  try {
    const u = await invoke<User>("restore_session");
    setUser(u);
  } catch {
    // No stored session — user will log in manually
  } finally {
    setAuthChecked(true);
  }

  listen<User>("twitch-auth-success", (e) => {
    setWaiting(false);
    setDeviceCode(null);
    setUser(e.payload);
    addToast("Connected to Twitch!", "success");
  });
  listen<string>("twitch-auth-error", (e) => {
    setWaiting(false);
    setDeviceCode(null);
    addToast(e.payload, "error");
  });
})();
