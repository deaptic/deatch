import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { toast } from "./notifications";
import { setUser } from "./user-state";
import type { DeviceCode, UserInfo } from "./types";

const [waiting, setWaiting] = createSignal(false);
const [deviceCode, setDeviceCode] = createSignal<DeviceCode | null>(null);
const [authChecked, setAuthChecked] = createSignal(false);

export { waiting, deviceCode, authChecked };

export async function login() {
  try {
    setDeviceCode(null);
    const code = await invoke<DeviceCode>("start_dcf_auth");
    setDeviceCode(code);
    setWaiting(true);
  } catch (e) {
    toast(String(e), "error");
  }
}

export function cancel() {
  setWaiting(false);
  setDeviceCode(null);
}

export async function logout() {
  try {
    await invoke("revoke_access_token");
    setUser(null);
  } catch (e) {
    toast(String(e), "error");
  }
}

(async () => {
  try {
    const u = await invoke<UserInfo>("try_restore_session");
    setUser(u);
  } catch {
    // No stored session — user will log in manually
  } finally {
    setAuthChecked(true);
  }

  listen<UserInfo>("twitch-auth-success", (e) => {
    setWaiting(false);
    setDeviceCode(null);
    setUser(e.payload);
    toast("Connected to Twitch!", "success");
  });
  listen<string>("twitch-auth-error", (e) => {
    setWaiting(false);
    setDeviceCode(null);
    toast(e.payload, "error");
  });
})();
